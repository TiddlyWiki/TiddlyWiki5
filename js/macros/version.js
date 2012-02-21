/*\
title: js/macros/version.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

exports.macro = {
	name: "version",
	types: ["text/html","text/plain"],
	params: {
	},
	execute: function() {
		return [Renderer.TextNode("5.0.0")];
	}
};

})();
