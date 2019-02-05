/*\
title: $:/core/modules/filters/numhash.js
type: application/javascript
module-type: filteroperator

Filter operator that returns a "qualified" hashstring for a list of input titles
Example feeding it with a list of transclusion variables that model the path
from a given point up to the page template (returns the same qualified string
like the <<qualify>> macro would do at that point):

filter="{|$:/core/ui/PageTemplate/story|||} {|$:/core/ui/PageTemplate|||} +[numhash[]]"

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.numhash = function(source,operator,options) {
	var titles = [],
	results = [],
	hashString;
	source(function(tiddler,title) {
			titles.push(title);
	});
	if(titles.length) {
		results.push($tw.utils.hashString(titles.join("")).toString());
	}
return results;
};

})();
