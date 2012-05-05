/*\
title: $:/core/modules/parsers/imageparser.js
type: application/javascript
module-type: parser

Parses an image into a parse tree containing an HTML img element

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ImageParser = function(options) {
    this.wiki = options.wiki;
};

ImageParser.prototype.parse = function(type,text) {
    var src;
    if(type === "image/svg+xml" || type === ".svg") {
        src = "data:image/svg+xml," + encodeURIComponent(text);
	} else {
        src = "data:" + type + ";base64," + text;
	}
	return new $tw.Renderer([$tw.Tree.Element("img",{src: src})],new $tw.Dependencies());
};

exports["image/svg+xml"] = ImageParser;
exports["image/jpg"] = ImageParser;
exports["image/jpeg"] = ImageParser;
exports["image/png"] = ImageParser;
exports["image/gif"] = ImageParser;

})();
