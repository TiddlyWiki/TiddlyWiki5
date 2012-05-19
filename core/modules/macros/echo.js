/*\
title: $:/core/modules/macros/echo.js
type: application/javascript
module-type: macro

Echo macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
