/*\
title: js/macros/list.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "list",
	types: ["text/html","text/plain"],
	dependantAll: true, // Tiddlers containing <<list>> macro are dependent on every tiddler
	params: {
		type: {byName: "default", type: "text", optional: false},
		template: {byName: true, type: "tiddler", optional: true},
		emptyMessage: {byName: true, type: "text", optional: true}
	},
	code: function(type,tiddler,store,params) {
		return "Listing!";
	}
};

})();
