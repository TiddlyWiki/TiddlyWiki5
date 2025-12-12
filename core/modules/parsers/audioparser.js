/*\
title: $:/core/modules/parsers/audioparser.js
type: application/javascript
module-type: parser

The audio parser parses an audio tiddler into an embeddable HTML element

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var AudioParser = function(type,text,options) {
	var element = {
			type: "element",
			tag: "$audio", // Using $audio to enable widget interception
			attributes: {
				controls: {type: "string", value: "controls"},
				style: {type: "string", value: "width: 100%; object-fit: contain"}
			}
		};
		
	// Pass through source information
	if(options._canonical_uri) {
		element.attributes.src = {type: "string", value: options._canonical_uri};
		element.attributes.type = {type: "string", value: type};
	} else if(text) {
		element.attributes.src = {type: "string", value: "data:" + type + ";base64," + text};
		element.attributes.type = {type: "string", value: type};
	}
	
	// Pass through tiddler title if available
	if(options.title) {
		element.attributes.tiddler = {type: "string", value: options.title};
	}
	
	this.tree = [element];
	this.source = text;
	this.type = type;
};

exports["audio/ogg"] = AudioParser;
exports["audio/mpeg"] = AudioParser;
exports["audio/mp3"] = AudioParser;
exports["audio/mp4"] = AudioParser;
	