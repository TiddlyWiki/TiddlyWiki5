/*\
title: $:/core/modules/info/platform.js
type: application/javascript
module-type: info

Initialise basic platform $:/info/ tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getInfoTiddlerFields = function() {
	var mapBoolean = function(value) {return value ? "yes" : "no"},
		infoTiddlerFields = [];
	// Basics
	infoTiddlerFields.push({title: "$:/info/browser", text: mapBoolean(!!$tw.browser)});
	return infoTiddlerFields;
};

})();
