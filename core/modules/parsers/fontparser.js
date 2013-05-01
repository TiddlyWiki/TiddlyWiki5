/*\
title: $:/core/modules/parsers/fontparser.js
type: application/javascript
module-type: parser

The font parser parses fonts into URI encoded base64

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var FontParser = function(type,text,options) {
	this.tree = [{
		type: "element",
		tag: "span",
		children: [
			{type: "text", text: "data:" + type + ";base64," + text}
		]
	}];
};

exports["application/font-woff"] = FontParser;

})();

