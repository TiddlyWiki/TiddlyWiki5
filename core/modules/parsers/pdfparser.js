/*\
title: $:/core/modules/parsers/pdfparser.js
type: application/javascript
module-type: parser

The PDF parser embeds a PDF viewer

\*/

"use strict";

const ImageParser = function(type,text,options) {
	const element = {
		type: "element",
		tag: "iframe",
		attributes: {}
	};
	let src;
	if(options._canonical_uri) {
		element.attributes.src = {type: "string",value: options._canonical_uri};
	} else if(text) {
		element.attributes.src = {type: "string",value: `data:application/pdf;base64,${text}`};
	}
	this.tree = [element];
	this.source = text;
	this.type = type;
};

exports["application/pdf"] = ImageParser;
