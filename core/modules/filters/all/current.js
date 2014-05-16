/*\
title: $:/core/modules/filters/all/current.js
type: application/javascript
module-type: allfilteroperator

Filter function for [all[current]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.current = function(source,prefix,options) {
	var currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(currTiddlerTitle) {
		return [currTiddlerTitle];
	} else {
		return [];
	}
};

})();
