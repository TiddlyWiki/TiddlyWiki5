/*\
title: $:/core/modules/parsers/binaryparser.js
type: application/javascript
module-type: parser

The binary parser parses a binary tiddler into a warning message and download link

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var BINARY_WARNING_MESSAGE = "$:/core/ui/BinaryWarning";
var EXPORT_BUTTON_IMAGE = "$:/core/images/export-button";

var BinaryParser = function(type,text,options) {
	// Transclude the binary data tiddler warning message
	var warn = {
		type: "element",
		tag: "p",
		children: [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string", value: BINARY_WARNING_MESSAGE}
			}
		}]
	};
	// Create download link based on binary tiddler title
	var link = {
		type: "element",
		tag: "a",
		attributes: {
			title: {type: "indirect", textReference: "!!title"},
			download: {type: "indirect", textReference: "!!title"}
		},
		children: [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string", value: EXPORT_BUTTON_IMAGE}
			}
		}]
	};
	// Set the link href to external or internal data URI
	if(options._canonical_uri) {
		link.attributes.href = {
			type: "string", 
			value: options._canonical_uri
		};
	} else if(text) {
		link.attributes.href = {
			type: "string", 
			value: "data:" + type + ";base64," + text
		};
	}
	// Combine warning message and download link in a div
	var element = {
		type: "element",
		tag: "div",
		attributes: {
			class: {type: "string", value: "tc-binary-warning"}
		},
		children: [warn, link]
	}
	this.tree = [element];
};

exports["application/octet-stream"] = BinaryParser;

})();

