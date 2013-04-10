/*\
title: $:/core/modules/parsers/htmlparser.js
type: application/javascript
module-type: parser

The HTML parser displays text as raw HTML

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HtmlParser = function(type,text,options) {
	this.tree = [{
		type: "raw",
		html: text
	}];
};

exports["text/html"] = HtmlParser;

})();

