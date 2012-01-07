/*\
title: js/macros/tiddler.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "tiddler",
	types: ["text/html","text/plain"],
	cascadeParams: true, // Cascade names of named parameters to following anonymous parameters
	params: {
		target: {byName: "default", type: "tiddler", optional: false},
		"with": {byName: true, type: "text", optional: true}
	},
	code: function(type,tiddler,store,params) {
		return store.renderTiddler(type,params.target);
	}
};

})();
