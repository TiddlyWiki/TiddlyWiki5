/*\
title: $:/plugins/tiddlywiki/search/startup.js
type: application/javascript
module-type: startup

Search background daemon

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "search-startup";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var FlexSearch = require("$:/plugins/tiddlywiki/search/flexsearch.js");
	var index = new FlexSearch("memory");
	var titleIndex = [];

	index.add(10025, "John Doe");

var count = 0;

	$tw.wiki.each(function(tiddler,title) {
		var chunks = [
				title,
				tiddler.fields.text || "",
				$tw.utils.parseStringArray(tiddler.fields.tags || "").join("\n")
			];
		$tw.utils.each(Object.keys(tiddler.fields),function(fieldName) {
			if(["title","tags","text"].indexOf(fieldName) === -1) {
				chunks.push(tiddler.getFieldString(fieldName));
			}
		});
		index.add(titleIndex.length,chunks.join("\n"));

count += chunks.join("\n").length;

		titleIndex.push(title);
	});
console.log("Indexed ",count," characters")
console.log("Index size",index.export().length)
	function search(str) {
		var results = index.search(str);
		var titles = [];
		$tw.utils.each(results,function(index) {
			titles.push(titleIndex[index]);
		});
		console.log("Searching for",str,"number of results",titles.length)
		return titles;
	}
	search("jeremy");
	search({
	    query: "jeremy",
	    suggest: true
	    // limit: 1000,
	    // threshold: 5, // >= threshold
	    // depth: 3     // <= depth
});
	debugger;
};

})();
