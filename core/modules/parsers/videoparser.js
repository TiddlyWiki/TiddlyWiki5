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
		
		$tw.hooks.addHook("th-page-refreshed", function() {
			Array.from(document.getElementsByClassName("tw-video-element")).forEach(function(video) {
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
				video.addEventListener('play', function(e) {
					if (video.buffered.length === 0 || (video.buffered.end(0) / video.duration) < bufferThreshold) {
						console.log('Waiting for buffer...');
						video.pause();
					}
				}, { passive: true });
				
				// Monitor buffering
				video.addEventListener('progress', function() {
					if (video.buffered.length > 0) {
						const progress = (video.buffered.end(0) / video.duration * 100).toFixed(2);
						console.log(`Buffer: ${progress}%`);
						overlay.innerHTML = `Loading ${progress}%`;
						
						if ((video.buffered.end(0) / video.duration) >= bufferThreshold) {
							overlay.style.display = 'none';
						}
					}
				}, { passive: true });
				
				const xhr = new XMLHttpRequest();
				xhr.open('GET', video.currentSrc, true);
				xhr.responseType = 'blob';
				
				xhr.onprogress = function(e) {
					if (e.lengthComputable) {
						console.log(`Download: ${(e.loaded / e.total * 100).toFixed(2)}%`);
					}
				};
				
				xhr.onload = function() {
					if (xhr.status === 200) {
						const blob = new Blob([xhr.response], { type: video.type || 'video/mp4' });
						const url = URL.createObjectURL(blob);
						video._blob = blob;
						video.src = url;
						processedVideos.set(video, {
							blob: blob,
							url: url
						});
						
						// Handle seeking with passive listener
						video.addEventListener('seeking', function() {
							if (!video.src || video.src === '') {
								video.src = URL.createObjectURL(video._blob);
							}
						}, { passive: true });
						
						// Cleanup
						const observer = new MutationObserver(function(mutations) {
							mutations.forEach(function(mutation) {
								if ([...mutation.removedNodes].includes(video)) {
									URL.revokeObjectURL(url);
									processedVideos.delete(video);
									observer.disconnect();
									if (overlay.parentNode) {
										overlay.parentNode.removeChild(overlay);
									}
								}
							});
						});
						
						observer.observe(video.parentNode, { 
							childList: true,
							subtree: true
						});
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
			});
		}, { passive: true });
	}

	this.tree = [element];
	this.type = type;
};

exports["video/ogg"] = VideoParser;
exports["video/webm"] = VideoParser;
exports["video/mp4"] = VideoParser;
exports["video/quicktime"] = VideoParser;

})();
