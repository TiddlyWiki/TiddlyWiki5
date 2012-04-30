/*\
title: $:/core/macros/echo.js
type: application/javascript
module-type: macro

\*/
(function(){

/*jslint node: true */
"use strict";

exports.info = {
	name: "echo",
	params: {
		text: {byPos: 0, type: "text"}
	}
};

exports.executeMacro = function() {
	return [$tw.Tree.Text(this.params.text)];
};


})();
