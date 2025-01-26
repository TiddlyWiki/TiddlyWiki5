/*\
title: $:/core/modules/filters/accumulate-palette-entries.js
type: application/javascript
module-type: filteroperator

A temporary filter operator for accumulating palette entries into a unique signature that can be used for cache invalidation. The signature is opaque, and should not be used for anything other than cache invalidation.

Hopefully we can figure out a way to do this within TW's filter language; it might be a good way to stretch the capabilities of the language.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["accumulate-palette-entries"] = function(source,operator,options) {
	var paletteTitle = operator.operand,
		wiki = options.wiki,
		visitedPalettes = [];
	// Recursive function to accumulate the palette entries from a single palette
	function accumulatePaletteEntries(title) {
		var tiddler = wiki.getTiddler(title),
			results = [];
		if(visitedPalettes.indexOf(title) === -1 && tiddler) {
			visitedPalettes.push(title);
			if(tiddler.fields["palette-import"]) {
				Array.prototype.push.apply(results,accumulatePaletteEntries(tiddler.fields["palette-import"]));
			}
			var json = wiki.getTiddlerData(tiddler,{});
			$tw.utils.each(Object.keys(json),function(key) {
				results.push(key + ":" + json[key]);
			});
		}
		return results;
	}
	var results = JSON.stringify(accumulatePaletteEntries(paletteTitle));
	results += wiki.getTiddlerAsJson(paletteTitle);
	return [results];
};

})();
