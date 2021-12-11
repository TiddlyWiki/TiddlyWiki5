/*\
title: $:/core/modules/editor/types/datetime.js
type: application/javascript
module-type: inputtype

Type module for HTML5 input elements with type="datetime-local"

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.type = "datetime-local";

exports.toValue = function(twDateTimeString) {
	var date = $tw.utils.parseDate(twDateTimeString);
	return $tw.utils.isValidDate(date) ? date.toISOString().substring(0,16) : "";
};

exports.fromValue = function(isoDateTimeString) {
	var date = new Date(isoDateTimeString);
	return $tw.utils.isValidDate(date) ? $tw.utils.stringifyDate(date) : "";
};

})();