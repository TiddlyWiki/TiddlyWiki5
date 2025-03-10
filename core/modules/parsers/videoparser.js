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
		tag: "$video", // Changed to $video to enable widget interception
		attributes: {
			controls: { type: "string", value: "controls" },
			style: { type: "string", value: "width: 100%; object-fit: contain" }
		}
	};

	// Pass through source information
	if (options._canonical_uri) {
		element.attributes.src = { type: "string", value: options._canonical_uri };
		element.attributes.type = { type: "string", value: type };
	} else if (text) {
		element.attributes.src = { type: "string", value: "data:" + type + ";base64," + text };
		element.attributes.type = { type: "string", value: type };
	}

	// Pass through tiddler title if available
	if (options.title) {
		element.attributes.tiddler = { type: "string", value: options.title };
	}

	this.tree = [element];
	this.type = type;
};

exports["video/ogg"] = VideoParser;
exports["video/webm"] = VideoParser;
exports["video/mp4"] = VideoParser;
exports["video/quicktime"] = VideoParser;

})();