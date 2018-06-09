/*\
title: $:/core/modules/parsers/binaryparser.js
type: application/javascript
module-type: parser

The video parser parses a video tiddler into an embeddable HTML element

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var BINARY_WARNING_MESSAGE = "$:/core/ui/BinaryWarning";

var BinaryParser = function(type,text,options) {
	this.tree = [{
		type: "transclude",
		attributes: {
			tiddler: {type: "string", value: BINARY_WARNING_MESSAGE}
		}
	}];
};

exports["application/octet-stream"] = BinaryParser;

})();

