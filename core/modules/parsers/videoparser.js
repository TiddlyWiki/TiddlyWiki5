/*\
title: $:/core/modules/parsers/videoparser.js
type: application/javascript
module-type: parser

The video parser parses a video tiddler into an embeddable HTML element

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var VideoParser = function(type,text,options) {
	var element = {
			type: "element",
			tag: "video",
			attributes: {
				controls: {type: "string", value: "controls"},
				style: {type: "string", value: "width: 100%; object-fit: contain"}
			}
		},
		src;
	if(options._canonical_uri) {
		element.attributes.src = {type: "string", value: options._canonical_uri};
	} else if(text) {
		element.attributes.src = {type: "string", value: "data:" + type + ";base64," + text};
	}
	this.tree = [element];
};

exports["video/ogg"] = VideoParser;
exports["video/webm"] = VideoParser;
exports["video/mp4"] = VideoParser;
exports["video/quicktime"] = VideoParser;

})();
