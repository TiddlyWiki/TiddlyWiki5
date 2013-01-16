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
	var element = "img",
		src;
	if(type === "application/pdf" || type === ".pdf") {
		src = "data:application/pdf;base64," + text;
		element = "embed";
	} else if(type === "image/svg+xml" || type === ".svg") {
		src = "data:image/svg+xml," + encodeURIComponent(text);
	} else {
		src = "data:" + type + ";base64," + text;
	}
	this.tree = [{
		type: "element",
		tag: element,
		attributes: {
			"src": {type: "string", value: src}
		}
	}];
};

exports["image/svg+xml"] = ImageParser;
exports["image/jpg"] = ImageParser;
exports["image/jpeg"] = ImageParser;
exports["image/png"] = ImageParser;
exports["image/gif"] = ImageParser;
exports["application/pdf"] = ImageParser;

})();

