/*\
title: $:/core/modules/widgets/video.js
type: application/javascript
module-type: widget

Video widget for handling video files with advanced features like:
- Automatic timestamp saving
- Buffering optimization
- Memory management
- Adaptive streaming

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VideoWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
VideoWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
VideoWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	
	// Create video element
	var videoElement = this.document.createElement("video");
	videoElement.setAttribute("controls", this.getAttribute("controls", "controls"));
	videoElement.setAttribute("style", this.getAttribute("style", "width: 100%; object-fit: contain"));
	videoElement.setAttribute("preload", this.getAttribute("preload", "auto"));
	videoElement.className = "tw-video-element";
	
	// Set source
	if(this.videoSource) {
		if (this.videoSource.indexOf("data:") === 0) {
			videoElement.setAttribute("src", this.videoSource);
		} else {
			var sourceElement = this.document.createElement("source");
			sourceElement.setAttribute("src", this.videoSource);
			if(this.videoType) {
				sourceElement.setAttribute("type", this.videoType);
			}
			videoElement.appendChild(sourceElement);
		}
	}
	
	// Insert the video into the DOM
	parent.insertBefore(videoElement, nextSibling);
	this.domNodes.push(videoElement);
	
	// Set up video features if in browser
	if($tw.browser) {
		this.setupVideoFeatures(videoElement);
	}
};

/*
Set up all the advanced video features when in a browser
*/
VideoWidget.prototype.setupVideoFeatures = function(videoElement) {
	var self = this;
	
	// Constants for video buffering
	var MEMORY_LIMIT = 100 * 1024 * 1024; // 100MB limit
	var CHUNK_SIZE = 1024 * 1024; // 1MB chunks
	var BUFFER_AHEAD = 3; // Buffer 3 chunks ahead
	var bufferThreshold = 0.1; // 10% buffered before play
	
	// Batched updates for tiddler fields
	var BatchedUpdates = {
		updates: {},
		timeout: null,
		
		queue: function(tiddlerTitle, fields) {
			const currentTiddler = $tw.wiki.getTiddler(tiddlerTitle);
			const hasChanged = Object.entries(fields).some(([field, value]) =>
				currentTiddler?.fields[field] !== value
			);
			
			if(hasChanged) {
				this.updates[tiddlerTitle] = this.updates[tiddlerTitle] || {};
				Object.assign(this.updates[tiddlerTitle], fields);
				
				if(this.timeout) clearTimeout(this.timeout);
				this.timeout = setTimeout(() => this.flush(), 2000);
			}
		},
		
		flush: function() {
			const updates = Object.entries(this.updates).map(([title, fields]) => {
				const tiddler = $tw.wiki.getTiddler(title);
				return tiddler ? new $tw.Tiddler(tiddler, fields) : null;
			}).filter(Boolean);
			
			if(updates.length) {
				$tw.wiki.addTiddlers(updates);
			}
			
			this.updates = {};
			this.timeout = null;
		}
	};
	
	// Chunk cache for video streaming
	var ChunkCache = function() {
		this.chunks = new Map();
		this.totalSize = 0;
		this.lastAccessed = new Map();
	};
	
	ChunkCache.prototype.has = function(key) {
		return this.chunks.has(key);
	};
	
	ChunkCache.prototype.set = function(key, value) {
		const size = value.byteLength;
		while(this.totalSize + size > MEMORY_LIMIT && this.chunks.size > 0) {
			const oldest = [...this.lastAccessed.entries()]
				.sort((a, b) => a[1] - b[1])[0][0];
			this.delete(oldest);
		}
		this.chunks.set(key, value);
		this.lastAccessed.set(key, Date.now());
		this.totalSize += size;
	};
	
	ChunkCache.prototype.get = function(key) {
		if(this.has(key)) {
			this.lastAccessed.set(key, Date.now());
			return this.chunks.get(key);
		}
		return null;
	};
	
	ChunkCache.prototype.delete = function(key) {
		const chunk = this.chunks.get(key);
		if(chunk) {
			this.totalSize -= chunk.byteLength;
			this.chunks.delete(key);
			this.lastAccessed.delete(key);
		}
	};
	
	const chunkCache = new ChunkCache();
	const processedVideos = new WeakMap();
	
	// Helper to get a unique field name for timestamp storage
	function getVideoTimestampField(video) {
		const sourceElement = video.querySelector('source');
		let originalSrc = sourceElement ? 
			sourceElement.getAttribute('src') : 
			video.getAttribute('src');
			
		if(originalSrc.startsWith('data:')) {
			originalSrc = originalSrc.substring(originalSrc.indexOf('base64,') + 7);
		}
		
		let hash = 5381;
		for(let i = 0; i < originalSrc.length; i++) {
			hash = (hash * 33) ^ originalSrc.charCodeAt(i);
		}
		return `video-timestamp-${Math.abs(hash >>> 0)}`;
	}
	
	// Safe buffer check helper
	function getBufferState(video) {
		const buffered = video.buffered;
		if(!buffered || buffered.length === 0) {
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
	
	// Optimized chunk loading
	async function loadChunks(src, endChunk, dynamicChunkSize = CHUNK_SIZE) {
		try {
			console.log(`[VideoWidget] Loading chunks up to ${endChunk}`);
			for(let i = 0; i < endChunk; i++) {
				const chunkKey = `${src}-${i}`;
				if(!chunkCache.has(chunkKey)) {
					const start = i * dynamicChunkSize;
					const end = start + dynamicChunkSize;
					
					const response = await fetch(src, {
						headers: { 'Range': `bytes=${start}-${end}` }
					});
					
					if(response.ok) {
						const chunk = await response.arrayBuffer();
						chunkCache.set(chunkKey, chunk);
						console.log(`[VideoWidget] Loaded chunk ${i}`, { size: chunk.byteLength });
					}
				}
			}
		} catch(error) {
			console.error(`[VideoWidget] Failed to load chunks: ${error.message}`);
		}
	}
	
	// Mark this video as initialized
	videoElement.dataset.initialized = "true";
	
	// Load timestamp listeners only after video is buffered and ready
	videoElement.addEventListener('canplay', function() {
		// Restore timestamp
		const currentTiddler = videoElement.closest('[data-tiddler-title]');
		if(currentTiddler) {
			const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
			const savedTime = $tw.wiki.getTiddler(tiddlerTitle)?.fields[getVideoTimestampField(videoElement)];
			if(savedTime) videoElement.currentTime = parseFloat(savedTime);
		}
		
		// Immediate timestamp saving on pause
		videoElement.addEventListener('pause', function() {
			const currentTiddler = videoElement.closest('[data-tiddler-title]');
			if(currentTiddler) {
				const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
				const tiddler = $tw.wiki.getTiddler(tiddlerTitle);
				if(tiddler) {
					const timestampField = getVideoTimestampField(videoElement);
					const currentTime = videoElement.currentTime;
					
					console.log(`[VideoWidget] Video paused - Time: ${currentTime.toFixed(2)}s, Field: ${timestampField}, Tiddler: ${tiddlerTitle}`);
					
					$tw.wiki.setText(tiddlerTitle, timestampField, null, currentTime.toString());
				}
			}
		});
		
	}, { once: true });
	
	videoElement.addEventListener('timeupdate', function() {
		const currentTime = this.currentTime;
		const prevTime = this.lastKnownTime || 0;
		const timeDiff = Math.abs(currentTime - prevTime);
		
		// Only update if not seeking AND either no last update OR 5+ seconds passed with 2+ second change
		if(!this.seeking &&
			(!this.lastUpdateTime ||
				(Date.now() - this.lastUpdateTime > 5000 &&
					Math.abs(currentTime - (this.lastSavedTime || 0)) > 2))) {
			
			const currentTiddler = this.closest('[data-tiddler-title]');
			if(currentTiddler) {
				const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
				this.lastSavedTime = currentTime;
				this.lastUpdateTime = Date.now();
				
				BatchedUpdates.queue(tiddlerTitle, {
					[getVideoTimestampField(this)]: currentTime.toString()
				});
			}
		}
		
		// Update immediately when seeking behavior is detected
		if(timeDiff > 2) {
			const currentTiddler = this.closest('[data-tiddler-title]');
			if(currentTiddler) {
				const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
				const timestampField = getVideoTimestampField(this);
				
				console.log('[VideoWidget] Time jump detected:', {
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
	
	videoElement.addEventListener('seeking', function() {
		console.log('[VideoWidget] Seeking started at:', this.currentTime);
		this.seekStartTime = this.currentTime;
	});
	
	if(processedVideos.has(videoElement)) return;
	
	// Create loading overlay
	const overlay = document.createElement('div');
	overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;';
	overlay.innerHTML = 'Loading 0%';
	videoElement.parentNode.style.position = 'relative';
	videoElement.parentNode.appendChild(overlay);
	
	videoElement.preload = "auto";
	videoElement.autobuffer = true;
	
	// Prevent play until buffered
	videoElement.addEventListener('play', function(e) {
		if(videoElement.buffered.length === 0 || (videoElement.buffered.end(0) / videoElement.duration) < bufferThreshold) {
			console.log('[VideoWidget] Waiting for buffer...');
			videoElement.pause();
		}
	}, { passive: true });
	
	// Monitor buffering
	videoElement.addEventListener('progress', function() {
		if(videoElement.buffered.length > 0) {
			const progress = (videoElement.buffered.end(0) / videoElement.duration * 100).toFixed(2);
			console.log(`[VideoWidget] Buffer: ${progress}%`);
			
			// Adaptive buffer threshold
			const networkSpeed = navigator.connection?.downlink || 10;
			const adaptiveThreshold = Math.max(0.1, Math.min(0.3, 1 / networkSpeed));
			
			if((videoElement.buffered.end(0) / videoElement.duration) >= adaptiveThreshold) {
				overlay.style.display = 'none';
			}
			
			// Preload next chunks
			const currentTime = videoElement.currentTime;
			const chunksNeeded = Math.ceil((currentTime + 30) / CHUNK_SIZE); // 30s ahead
			loadChunks(videoElement.currentSrc, chunksNeeded);
		}
	}, { passive: true });
	
	const xhr = new XMLHttpRequest();
	xhr.open('GET', videoElement.currentSrc, true);
	xhr.responseType = 'blob';
	
	// Add range support
	xhr.setRequestHeader('Range', 'bytes=0-');
	xhr.setRequestHeader('Cache-Control', 'no-cache');
	xhr.setRequestHeader('Pragma', 'no-cache');
	
	if('connection' in navigator) {
		const connectionSpeed = navigator.connection?.downlink || 10;
		const initialChunkSize = Math.min(CHUNK_SIZE, connectionSpeed * 1024 * 100);
		xhr.setRequestHeader('Range', `bytes=0-${initialChunkSize}`);
	}
	
	// Improved progress tracking
	xhr.onprogress = function(e) {
		if(e.lengthComputable) {
			const progress = (e.loaded / e.total * 100).toFixed(2);
			console.log(`[VideoWidget] Download: ${progress}%`);
			
			if(overlay) {
				overlay.innerHTML = `Loading ${progress}%`;
				if(progress > (bufferThreshold * 100)) {
					overlay.style.display = 'none';
				}
			}
		}
	};
	
	xhr.onload = function() {
		if(xhr.status === 200 || xhr.status === 206) {
			// Only process if not already initialized
			if(!processedVideos.has(videoElement)) {
				const blob = new Blob([xhr.response], { type: videoElement.getAttribute("type") || 'video/mp4' });
				const url = URL.createObjectURL(blob);
				videoElement._blob = blob;
				videoElement.src = url;
				processedVideos.set(videoElement, {
					blob: blob,
					url: url,
					initialized: true
				});
				
				// Only add timestamp restoration on initial load
				videoElement.addEventListener('canplaythrough', function onCanPlay() {
					const currentTiddler = videoElement.closest('[data-tiddler-title]');
					if(currentTiddler) {
						const tiddlerTitle = currentTiddler.getAttribute('data-tiddler-title');
						const savedTime = $tw.wiki.getTiddler(tiddlerTitle)?.fields[getVideoTimestampField(videoElement)];
						if(savedTime) {
							videoElement.currentTime = parseFloat(savedTime);
						}
					}
					videoElement.removeEventListener('canplaythrough', onCanPlay);
				});
			}
		}
	};
	
	xhr.send();
	
	// Monitor memory usage
	setInterval(() => {
		if(performance.memory) {
			const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
			if(memoryUsage > 90) {
				chunkCache.chunks.clear();
				chunkCache.totalSize = 0;
				chunkCache.lastAccessed.clear();
			}
		}
	}, 30000);
};

/*
Compute the internal state of the widget
*/
VideoWidget.prototype.execute = function() {
	// Get the video source and type
	this.videoSource = this.getAttribute("src");
	this.videoType = this.getAttribute("type");
	this.videoControls = this.getAttribute("controls", "controls");
	
	// Make sure we have a tiddler for saving timestamps
	this.tiddlerTitle = this.getAttribute("tiddler");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
VideoWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.src || changedAttributes.type || changedAttributes.controls) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.video = VideoWidget;

})();
