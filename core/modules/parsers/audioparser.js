/*\
title: $:/core/modules/parsers/audioparser.js
type: application/javascript
module-type: parser
\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var AudioParser = function (type, text, options) {
	var element = {
		type: "element",
		tag: "audio",
		attributes: {
			controls: { type: "string", value: "controls" },
			style: { type: "string", value: "width: 100%; object-fit: contain" },
			preload: { type: "string", value: "auto" }, // Changed to auto for full loading
			class: { type: "string", value: "tw-audio-element" }
		}
	};

	// Set source with range support
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
		$tw.hooks.addHook("th-page-refreshed", function () {
			setTimeout(function () {
				Array.from(document.getElementsByClassName("tw-audio-element")).forEach(function (audio) {
					// Force aggressive loading
					audio.preload = "auto";
					audio.autobuffer = true;

					// Create XMLHttpRequest to load full file
					var xhr = new XMLHttpRequest();
					xhr.open('GET', audio.currentSrc, true);
					xhr.responseType = 'blob';
					
					xhr.onprogress = function(e) {
						if (e.lengthComputable) {
							var percentComplete = (e.loaded / e.total) * 100;
							console.log("Loading: " + percentComplete.toFixed(2) + "%");
						}
					};
					
					xhr.onload = function() {
						if (xhr.status === 200) {
							var blob = new Blob([xhr.response], { type: type });
							var url = URL.createObjectURL(blob);
							audio.src = url;
						}
					};
					
					xhr.send();

					// Monitor buffer state
					audio.addEventListener("progress", function() {
						var buffered = this.buffered;
						if(buffered.length > 0) {
							var total = 0;
							for(var i = 0; i < buffered.length; i++) {
								var start = buffered.start(i);
								var end = buffered.end(i);
								total += (end - start);
								console.log(`Buffer ${i}: ${start}-${end} (${((end-start)/this.duration*100).toFixed(2)}%)`);
							}
							console.log(`Total buffered: ${(total/this.duration*100).toFixed(2)}%`);
						}
					});
				});
			}, 100);
		});
	}

	this.tree = [element];
	this.type = type;
};

exports["audio/ogg"] = AudioParser;
exports["audio/mpeg"] = AudioParser;
exports["audio/mp3"] = AudioParser;
exports["audio/mp4"] = AudioParser;

})();