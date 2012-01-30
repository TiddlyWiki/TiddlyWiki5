/*\
title: js/macros/echo.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "echo",
	types: ["text/html","text/plain"],
	params: {
		text: {byPos: 0, type: "text", optional: false}
	},
	render: function(type,tiddler,store,params) {
		if(type === "text/html") {
			return utils.htmlEncode(params.text);
		} else {
			return params.text;
		}
	}
};

})();
