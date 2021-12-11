/*\
title: $:/core/modules/editor/types/date.js
type: application/javascript
module-type: inputtype

Type module for HTML5 input elements with type="date"

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.type = "date";

exports.toValue = function(twDateTimeString) {
	var date = $tw.utils.parseDate(twDateTimeString);
	return $tw.utils.isValidDate(date) ? date.toISOString().substring(0,10) : "";
};

exports.fromValue = function(isoDateString) {
	var date = new Date(isoDateString);
	return $tw.utils.isValidDate(date) ? $tw.utils.stringifyDate(date) : "";
};

})();