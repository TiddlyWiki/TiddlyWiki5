/*\
title: $:/core/modules/parsers/videoparser.js
type: application/javascript
module-type: parser

The video parser parses a video tiddler into an embeddable HTML element

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	const VIDEO_STATE = new WeakMap();

	const BatchedUpdates = {
		updates: {},
		timeout: null,

		queue: function (tiddlerTitle, fields) {
			const currentTiddler = $tw.wiki.getTiddler(tiddlerTitle);
			const hasChanged = Object.entries(fields).some(([field, value]) =>
				currentTiddler?.fields[field] !== value
			);

			if (hasChanged) {
				this.updates[tiddlerTitle] = this.updates[tiddlerTitle] || {};
				Object.assign(this.updates[tiddlerTitle], fields);

				if (this.timeout) clearTimeout(this.timeout);
				this.timeout = setTimeout(() => this.flush(), 2000);
			}
		},

		flush: function () {
			const updates = Object.entries(this.updates).map(([title, fields]) => {
				const tiddler = $tw.wiki.getTiddler(title);
				return tiddler ? new $tw.Tiddler(tiddler, fields) : null;
			}).filter(Boolean);

			if (updates.length) {
				$tw.wiki.addTiddlers(updates);
			}

			this.updates = {};
			this.timeout = null;
		}
	};

	const Debug = {
		enabled: true,
		prefix: '🎥 [VideoParser]',

		log: function (category, message, data = {}) {
			if (!this.enabled) return;
			const timestamp = performance.now().toFixed(2);
			console.log(`${this.prefix} [${timestamp}ms] [${category}] ${message}`, data);
		},

		state: function (video, event = '') {
			if (!this.enabled) return;
			this.log('State', `${event}`, {
				currentTime: video.currentTime?.toFixed(2),
				seeking: video.seeking,
				readyState: video.readyState,
				paused: video.paused,
				buffered: Array.from(video.buffered).map(i => ({
					start: video.buffered.start(i),
					end: video.buffered.end(i)
				})),
				dataset: { ...video.dataset },
				error: video.error
			});
		}
	};

	// Add helper function at top
	function getVideoTimestampField(video) {
		const sourceElement = video.querySelector('source');
		let originalSrc = sourceElement ? sourceElement.getAttribute('src') : video.getAttribute('src');
		if (originalSrc.startsWith('data:')) {
			originalSrc = originalSrc.substring(originalSrc.indexOf('base64,') + 7);
		}
		let hash = 0;
		for (let i = 0; i < originalSrc.length; i++) {
			hash = ((hash << 5) - hash) + originalSrc.charCodeAt(i);
			hash = hash & hash;
		}
		return `video-timestamp-${Math.abs(hash)}`;
	}

	// Add performance monitoring and cache management
	const MEMORY_LIMIT = 100 * 1024 * 1024; // 100MB limit
	const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
	const BUFFER_AHEAD = 3;

	class ChunkCache {
		constructor() {
			this.chunks = new Map();
			this.totalSize = 0;
			this.lastAccessed = new Map();
		}

		has(key) {
			return this.chunks.has(key);
		}

		set(key, value) {
			const size = value.byteLength;
			while (this.totalSize + size > MEMORY_LIMIT && this.chunks.size > 0) {
				const oldest = [...this.lastAccessed.entries()]
					.sort((a, b) => a[1] - b[1])[0][0];
				this.delete(oldest);
			}
			this.chunks.set(key, value);
			this.lastAccessed.set(key, Date.now());
			this.totalSize += size;
		}

		get(key) {
			if (this.has(key)) {
				this.lastAccessed.set(key, Date.now());
				return this.chunks.get(key);
			}
			return null;
		}

		delete(key) {
			const chunk = this.chunks.get(key);
			if (chunk) {
				this.totalSize -= chunk.byteLength;
				this.chunks.delete(key);
				this.lastAccessed.delete(key);
			}
		}
	}

	const chunkCache = new ChunkCache();

	// Add constants for streaming
	const MIN_BUFFER_SIZE = 2; // 2 seconds minimum buffer
	const INITIAL_SEGMENT_DURATION = 4; // 4 second segments
	const QUALITY_LEVELS = [
		{ width: 1920, height: 1080, bitrate: 5000000 },
		{ width: 1280, height: 720, bitrate: 2500000 },
		{ width: 854, height: 480, bitrate: 1000000 },
		{ width: 640, height: 360, bitrate: 500000 }
	];

	let currentQuality = QUALITY_LEVELS.length - 1; // Start with lowest quality

	class VideoStreamManager {
		constructor() {
			this.chunkCache = new ChunkCache();
			this.sourceBuffer = null;
			this.mediaSource = null;
		}

		async fetchVideoSegment(src, startTime, duration, quality) {
			try {
				// Convert blob URL to actual video source if needed
				const videoSrc = src.startsWith('blob:') ? src.split('?')[0] : src;

				// Properly serialize quality parameters
				const qualityString = `width=${quality.width}&height=${quality.height}&bitrate=${quality.bitrate}`;
				const url = `${videoSrc}?start=${startTime}&duration=${duration}&${qualityString}`;

				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return await response.arrayBuffer();
			} catch (error) {
				console.error('Error fetching video segment:', error);
				throw error;
			}
		}

		async loadSegment(video, startTime, duration, qualityIndex) {
			try {
				const quality = QUALITY_LEVELS[qualityIndex];
				const segment = await this.fetchVideoSegment(video.src, startTime, duration, quality);

				if (this.sourceBuffer && !this.sourceBuffer.updating) {
					await this.sourceBuffer.appendBuffer(segment);
					return true;
				}
			} catch (error) {
				console.error('Error loading segment:', error);
				// Try lower quality if available
				if (qualityIndex > 0) {
					return this.loadSegment(video, startTime, duration, qualityIndex - 1);
				}
			}
			return false;
		}

		async loadChunks(video, endChunk) {
			for (let i = 0; i < endChunk; i++) {
				const startTime = i * INITIAL_SEGMENT_DURATION;
				await this.loadSegment(video, startTime, INITIAL_SEGMENT_DURATION, currentQuality);
			}
		}

		setupMediaSource(video) {
			this.mediaSource = new MediaSource();
			video.src = URL.createObjectURL(this.mediaSource);

			this.mediaSource.addEventListener('sourceopen', () => {
				this.sourceBuffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');

				// Monitor buffer
				video.addEventListener('timeupdate', () => {
					const buffered = video.buffered;
					if (buffered && buffered.length > 0) {
						const bufferEnd = buffered.end(buffered.length - 1);
						const currentTime = video.currentTime;

						if (bufferEnd - currentTime < MIN_BUFFER_SIZE) {
							this.loadSegment(video, currentTime, INITIAL_SEGMENT_DURATION, currentQuality);
						}
					}
				});
			});
		}
	}


	function getVideoTimestampField(video) {
		const sourceElement = video.querySelector('source');
		let originalSrc = sourceElement ? 
			sourceElement.getAttribute('src') : 
			video.getAttribute('src');

		let hash = 5381;
		for (let i = 0; i < originalSrc.length; i++) {
			hash = (hash * 33) ^ originalSrc.charCodeAt(i);
		}
		return `video-timestamp-${Math.abs(hash >>> 0)}`;
	}

	var VideoParser = function (type, text, options) {
		var element = {
			type: "element",
			tag: "video",
			attributes: {
				controls: { type: "string", value: "controls" },
				style: { type: "string", value: "width: 100%; object-fit: contain" },
				preload: { type: "string", value: "auto" },
				class: { type: "string", value: "tw-video-element" }
			}
		};

		if (options._canonical_uri) {
			element.children = [{
				type: "element",
				tag: "source",
				attributes: {
					src: { type: "string", value: options._canonical_uri },
					type: { type: "string", value: type }
				}
			}];
		} else if (text) {
			element.attributes.src = { type: "string", value: "data:" + type + ";base64," + text };
		}

		if ($tw.browser) {
			const processedVideos = new WeakMap();
			const bufferThreshold = 0.1; // 10% buffered before play

			$tw.hooks.addHook("th-page-refreshed", function () {
				setTimeout(function () {
					Array.from(document.getElementsByClassName("tw-video-element")).forEach(function (video) {
						if (!video.dataset.initialized) {
							video.dataset.initialized = "true";

							// Load timestamp listeners only after video is buffered and ready
							video.addEventListener('canplay', function () {
								// Restore timestamp
								const currentTiddler = video.closest('[data-tiddler-title]');
								if (currentTiddler) {
									const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
									const savedTime = $tw.wiki.getTiddler(tiddlerTitle)?.fields[getVideoTimestampField(video)];
									if (savedTime) video.currentTime = parseFloat(savedTime);
								}

								// Immediate timestamp saving on pause
								video.addEventListener('pause', function () {
									const currentTiddler = video.closest('[data-tiddler-title]');
									if (currentTiddler) {
										const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
										const tiddler = $tw.wiki.getTiddler(tiddlerTitle);
										if (tiddler) {
											const timestampField = getVideoTimestampField(video);
											const currentTime = video.currentTime;
											
											console.log(`[VideoParser] Video paused - Time: ${currentTime.toFixed(2)}s, Field: ${timestampField}, Tiddler: ${tiddlerTitle}`);

											$tw.wiki.setText(tiddlerTitle, timestampField, null, currentTime.toString());
										}
									}
								});

							}, { once: true });

							video.addEventListener('timeupdate', function () {
								const currentTime = this.currentTime;
								const prevTime = this.lastKnownTime || 0;
								const timeDiff = Math.abs(currentTime - prevTime);

								// Only update if not seeking AND either no last update OR 5+ seconds passed with 2+ second change
								if (!this.seeking &&
									(!this.lastUpdateTime ||
										(Date.now() - this.lastUpdateTime > 5000 &&
											Math.abs(currentTime - (this.lastSavedTime || 0)) > 2))) {

									const currentTiddler = this.closest('[data-tiddler-title]');
									if (currentTiddler) {
										const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
										this.lastSavedTime = currentTime;
										this.lastUpdateTime = Date.now();

										BatchedUpdates.queue(tiddlerTitle, {
											[getVideoTimestampField(this)]: currentTime.toString()
										});
									}
								}

								// Update immediately when seeking behavior is detected
								if (timeDiff > 2) {
									const currentTiddler = this.closest('[data-tiddler-title]');
									if (currentTiddler) {
										const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
										const timestampField = getVideoTimestampField(this);

										console.log('[VideoParser] Time jump detected:', {
											from: prevTime,
											to: currentTime,
											diff: timeDiff
										});

										$tw.wiki.setText(
											tiddlerTitle,
											timestampField,
											null,
											currentTime.toString()
										);
									}
								}
								this.lastKnownTime = currentTime;
							}, { passive: true });
							
							video.addEventListener('playing', function () {
								this.isPlaying = true;
								Debug.log('Video playing state set');
							});

							video.addEventListener('seeking', function () {
								console.log('[VideoParser] Seeking started at:', this.currentTime);
								this.seekStartTime = this.currentTime;
							});

							
							if (processedVideos.has(video)) return;

							// Create loading overlay
							const overlay = document.createElement('div');
							overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;';
							overlay.innerHTML = 'Loading 0%';
							video.parentNode.style.position = 'relative';
							video.parentNode.appendChild(overlay);

							video.preload = "auto";
							video.autobuffer = true;

							// Prevent play until buffered
							video.addEventListener('play', function (e) {
								if (video.buffered.length === 0 || (video.buffered.end(0) / video.duration) < bufferThreshold) {
									console.log('Waiting for buffer...');
									video.pause();
								}
							}, { passive: true });

							// Monitor buffering
							video.addEventListener('progress', function () {
								if (video.buffered.length > 0) {
									const progress = (video.buffered.end(0) / video.duration * 100).toFixed(2);
									console.log(`Buffer: ${progress}%`);

									// Adaptive buffer threshold
									const networkSpeed = navigator.connection?.downlink || 10;
									const adaptiveThreshold = Math.max(0.1, Math.min(0.3, 1 / networkSpeed));

									if ((video.buffered.end(0) / video.duration) >= adaptiveThreshold) {
										overlay.style.display = 'none';
									}

									// Preload next chunks
									const currentTime = video.currentTime;
									const chunksNeeded = Math.ceil((currentTime + 30) / CHUNK_SIZE); // 30s ahead
									loadChunks(video.currentSrc, chunksNeeded);
								}
							}, { passive: true });

							const xhr = new XMLHttpRequest();
							xhr.open('GET', video.currentSrc, true);
							xhr.responseType = 'blob';

							// Add range support
							xhr.setRequestHeader('Range', 'bytes=0-');
							xhr.setRequestHeader('Cache-Control', 'no-cache');
							xhr.setRequestHeader('Pragma', 'no-cache');

							if ('connection' in navigator) {
								const connectionSpeed = navigator.connection?.downlink || 10;
								const initialChunkSize = Math.min(CHUNK_SIZE, connectionSpeed * 1024 * 100);
								xhr.setRequestHeader('Range', `bytes=0-${initialChunkSize}`);
							}

							// Improved progress tracking
							xhr.onprogress = function (e) {
								if (e.lengthComputable) {
									const progress = (e.loaded / e.total * 100).toFixed(2);
									console.log(`Download: ${progress}%`);

									if (overlay) {
										overlay.innerHTML = `Loading ${progress}%`;
										if (progress > (bufferThreshold * 100)) {
											overlay.style.display = 'none';
										}
									}
								}
							};

							xhr.onload = function () {
								if (xhr.status === 200 || xhr.status === 206) {
									// Only process if not already initialized
									if (!processedVideos.has(video)) {
										const blob = new Blob([xhr.response], { type: video.type || 'video/mp4' });
										const url = URL.createObjectURL(blob);
										video._blob = blob;
										video.src = url;
										processedVideos.set(video, {
											blob: blob,
											url: url,
											initialized: true
										});

										// Only add timestamp restoration on initial load
										video.addEventListener('canplaythrough', function onCanPlay() {
											const currentTiddler = video.closest('[data-tiddler-title]');
											if (currentTiddler) {
												const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
												const savedTime = $tw.wiki.getTiddler(tiddlerTitle)?.fields[getVideoTimestampField(video)];
												if (savedTime) {
													video.currentTime = parseFloat(savedTime);
												}
											}
											video.removeEventListener('canplaythrough', onCanPlay);
										});
									}
								}
							};

							xhr.send();

							video.addEventListener('loadedmetadata', async () => {
								requestAnimationFrame(async () => {
									const xhr = new XMLHttpRequest();
									// Encode the URL to handle spaces and special characters
									const encodedUrl = encodeURI(video.currentSrc);
									xhr.open('HEAD', encodedUrl);

									xhr.onload = () => {
										const observer = new MutationObserver((mutations) => {
											requestAnimationFrame(() => {
												mutations.forEach((mutation) => {
													if (mutation.addedNodes.length) {
														const overlay = mutation.target.querySelector('.play-overlay');
														if (overlay) {
															overlay.parentNode.removeChild(overlay);
														}
													}
												});
											});
										});

										observer.observe(video.parentNode, {
											childList: true,
											subtree: true
										});
									};

									xhr.send();
								});
							}, { passive: true });

							const metrics = {
								bufferCount: 0,
								droppedFrames: 0,
								loadTime: 0
							};

							video.addEventListener('progress', function () {
								const { isBuffered, bufferEnd } = getBufferState(video);
								if (isBuffered) {
									// Dynamic chunk size based on network conditions
									const networkSpeed = navigator.connection?.downlink || 10;
									const dynamicChunkSize = Math.min(
										CHUNK_SIZE * 2,
										Math.max(CHUNK_SIZE / 2, networkSpeed * 100 * 1024)
									);

									// Predictive loading based on playback patterns
									const currentChunk = Math.floor(video.currentTime / (dynamicChunkSize / 1024 / 1024));
									const playbackRate = video.playbackRate;
									const predictedChunks = Math.ceil(playbackRate * BUFFER_AHEAD);

									loadChunks(video.currentSrc, currentChunk + predictedChunks, dynamicChunkSize);

									// Track performance
									metrics.bufferCount++;
									requestAnimationFrame(() => {
										if (video.getVideoPlaybackQuality) {
											metrics.droppedFrames = video.getVideoPlaybackQuality().droppedVideoFrames;
										}
									});
								}
							}, { passive: true });

							// Debug logging
							video.addEventListener('progress', function () {
								const { isBuffered, bufferEnd } = getBufferState(video);
								if (isBuffered) {
									// Network monitoring
									const networkSpeed = navigator.connection?.downlink || 10;
									Debug.log('Network', `Speed detected: ${networkSpeed}Mbps`);

									// Chunk calculations
									const dynamicChunkSize = Math.min(
										CHUNK_SIZE * 2,
										Math.max(CHUNK_SIZE / 2, networkSpeed * 100 * 1024)
									);
									Debug.log('Chunks', `Dynamic chunk size: ${(dynamicChunkSize / 1024 / 1024).toFixed(2)}MB`, {
										networkSpeed,
										baseSize: CHUNK_SIZE / 1024 / 1024
									});

									// Buffer state
									Debug.log('Buffer', `Current state`, {
										bufferEnd,
										duration: video.duration,
										percentage: ((bufferEnd / video.duration) * 100).toFixed(2) + '%'
									});

									// Memory tracking
									if (performance.memory) {
										Debug.log('Memory', `Usage stats`, {
											heapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
											cacheSize: (chunkCache.totalSize / 1024 / 1024).toFixed(2) + 'MB'
										});
									}

									// Quality metrics
									Debug.log('Performance', `Playback metrics`, {
										bufferCount: metrics.bufferCount,
										droppedFrames: metrics.droppedFrames,
										loadTime: metrics.loadTime
									});
								}
							}, { passive: true });

							// Monitor memory usage
							setInterval(() => {
								if (performance.memory) {
									const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
									if (memoryUsage > 90) {
										chunkCache.chunks.clear();
										chunkCache.totalSize = 0;
										chunkCache.lastAccessed.clear();
									}
								}
							}, 30000);

							// Enable streaming, if supported
							if ('MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')) {
								const streamManager = new VideoStreamManager();
								streamManager.setupMediaSource(video);
							} else {
								initializeVideo(video);
							}

							// Add event listeners
							video.addEventListener('loadstart', () => Debug.state(video, 'loadstart'), { passive: true });
							video.addEventListener('loadedmetadata', () => Debug.state(video, 'loadedmetadata'), { passive: true });
							video.addEventListener('canplay', () => Debug.state(video, 'canplay'), { passive: true });
							video.addEventListener('play', () => Debug.state(video, 'play'), { passive: true });
							video.addEventListener('seeking', () => Debug.state(video, 'seeking'), { passive: true });
							video.addEventListener('seeked', () => Debug.state(video, 'seeked'), { passive: true });
							video.addEventListener('timeupdate', () => Debug.state(video, 'timeupdate'), { passive: true });
							video.addEventListener('waiting', () => Debug.state(video, 'waiting'), { passive: true });
							video.addEventListener('error', () => Debug.state(video, 'error'), { passive: true });
						}
					});
				}, 100);
			}, { passive: true });
		}

		this.tree = [element];
		this.type = type;
	};

	// Optimized chunk loading
	async function loadChunks(src, endChunk, dynamicChunkSize = CHUNK_SIZE) {
		try {
			Debug.log('Chunks', `Loading chunks up to ${endChunk}`);
			for (let i = 0; i < endChunk; i++) {
				const chunkKey = `${src}-${i}`;
				if (!chunkCache.has(chunkKey)) {
					const start = i * dynamicChunkSize;
					const end = start + dynamicChunkSize;

					const response = await fetch(src, {
						headers: { 'Range': `bytes=${start}-${end}` }
					});

					if (response.ok) {
						const chunk = await response.arrayBuffer();
						chunkCache.set(chunkKey, chunk);
						Debug.log('Chunks', `Loaded chunk ${i}`, { size: chunk.byteLength });
					}
				}
			}
		} catch (error) {
			Debug.log('Error', `Failed to load chunks: ${error.message}`);
		}
	}

	// Add safe buffer check helper
	function getBufferState(video) {
		const buffered = video.buffered;
		if (!buffered || buffered.length === 0) {
			return {
				bufferEnd: 0,
				bufferStart: 0,
				isBuffered: false
			};
		}

		return {
			bufferEnd: buffered.end(buffered.length - 1),
			bufferStart: buffered.start(buffered.length - 1),
			isBuffered: true
		};
	}

	function initializeVideo(video) {
		// Get or create state
		let state = VIDEO_STATE.get(video);
		if (!state) {
			state = {
				initialTime: video.currentTime || 0,
				hasInitialized: false,
				lastChunkLoad: 0,
				preventReload: false
			};
			VIDEO_STATE.set(video, state);
		}

		// Block reloads after initialization
		const preventReload = (e) => {
			if (state.preventReload) {
				Debug.log('Load', 'Preventing reload');
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		};

		// Preserve state across saves
		video.addEventListener('beforeunload', () => {
			state.initialTime = video.currentTime;
		});

		// Handle initialization once
		const handleInit = () => {
			if (state.hasInitialized) return;

			Debug.log('Init', 'Initializing video', { initialTime: state.initialTime });
			state.hasInitialized = true;
			state.preventReload = true;

			if (state.initialTime > 0) {
				video.currentTime = state.initialTime;
			}
		};

		// Event listeners
		video.addEventListener('loadstart', preventReload, true);
		video.addEventListener('load', preventReload, true);
		video.addEventListener('loadedmetadata', handleInit, { once: true });
	}

	exports["video/ogg"] = VideoParser;
	exports["video/webm"] = VideoParser;
	exports["video/mp4"] = VideoParser;
	exports["video/quicktime"] = VideoParser;

})();
