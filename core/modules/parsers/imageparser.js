/*\
title: $:/core/modules/parsers/imageparser.js
type: application/javascript
module-type: parser

The image parser parses an image into an embeddable HTML element

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ImageParser = function(type,text,options) {
	var element = {
			type: "element",
			tag: "img",
			attributes: {}
		},
		src;
	if(text) {
		if(type === "application/pdf" || type === ".pdf") {
			element.attributes.src = {type: "string", value: "data:application/pdf;base64," + text};
			element.tag = "embed";
		} else if(type === "image/svg+xml" || type === ".svg") {
			element.attributes.src = {type: "string", value: "data:image/svg+xml," + encodeURIComponent(text)};
		} else {
			element.attributes.src = {type: "string", value: "data:" + type + ";base64," + text};
		}
	}
	this.tree = [element];
};

exports["image/svg+xml"] = ImageParser;
exports["image/jpg"] = ImageParser;
exports["image/jpeg"] = ImageParser;
exports["image/png"] = ImageParser;
exports["image/gif"] = ImageParser;
exports["application/pdf"] = ImageParser;
exports["image/x-icon"] = ImageParser;

})();

