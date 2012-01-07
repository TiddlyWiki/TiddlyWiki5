/*\
title: js/macros/version.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "version",
	types: ["text/html","text/plain"],
	params: {
	},
	code: function(type,tiddler,store,params) {
		return "5.0.0";
	}
};

})();
