/*\
title: $:/core/modules/macros/serverpath.js
type: application/javascript
module-type: macro

Outputs a server-path based on parameters,
by default appends a relative path to an absolute one,
e.g. constructs path to TiddlySpot backup directory

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "serverpath";

exports.params = [
	{name: "source"},
	{name: "target"},
	{name: "mode"}
];

/*
Run the macro
*/
exports.run = function(source, target, mode) {
	var result = target;
	mode = mode || "";
	switch (mode){
		case "":
		case "append-relative":
			target = ("." == target || "./" == target) ? "" : target;
			result = source.substr(0,1+source.lastIndexOf('/')) + target;
			break;
	}
	return result;
};

})();
