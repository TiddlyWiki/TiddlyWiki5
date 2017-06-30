/*\
title: $:/core/modules/macros/now.js
type: application/javascript
module-type: macro

Macro to return a formatted version of the current time

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "now";

exports.params = [
	{name: "format"}
];

/*
Run the macro
*/
exports.run = function(format) {
	return $tw.utils.formatDateString(new Date(),format || "0hh:0mm, DDth MMM YYYY");
};

})();
