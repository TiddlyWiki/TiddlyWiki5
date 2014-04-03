/*\
title: $:/core/modules/filters/all/shadows.js
type: application/javascript
module-type: allfilteroperator

Filter function for [all[shadows]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.shadows = function(source,prefix,options) {
	var results = [];
	options.wiki.eachShadow(function(tiddler,title) {
		results.push(title);
	});
	return results;
};

})();
