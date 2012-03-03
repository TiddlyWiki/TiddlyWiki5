/*\
title: js/ImageParser.js

Compiles images into JavaScript functions that render them in HTML

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextParseTree = require("./WikiTextParseTree.js").WikiTextParseTree,
    Renderer = require("./Renderer.js").Renderer,
    Dependencies = require("./Dependencies.js").Dependencies,
    utils = require("./Utils.js");

var ImageParser = function(options) {
    this.store = options.store;
};

ImageParser.prototype.parse = function(type,text) {
    var src;
    if(type === "image/svg+xml" || type === ".svg") {
        src = "data:" + type + "," + encodeURIComponent(text);
	} else {
        src = "data:" + type + ";base64," + text;
	}
	return new WikiTextParseTree([Renderer.ElementNode("img",{src: src})],new Dependencies(),this.store);
};

exports.ImageParser = ImageParser;

})();
