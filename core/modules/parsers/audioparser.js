/*\
title: $:/core/modules/parsers/audioparser.js
type: application/javascript
module-type: parser

The audio parser parses an audio tiddler into an embeddable HTML element

\*/

"use strict";

var AudioParser = function(type,text,options) {
	var element = {
			type: "element",
			tag: "audio",
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
	this.source = text;
	this.type = type;
};

exports["audio/ogg"] = AudioParser;
exports["audio/mpeg"] = AudioParser;
exports["audio/mp3"] = AudioParser;
exports["audio/mp4"] = AudioParser;
