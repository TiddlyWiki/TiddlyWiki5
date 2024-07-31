/*\
title: $:/core/modules/filters/tags.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the tags of the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
LinkedList instead of Object. Should be as performant but allows us to have unsorted arrays.
*/
exports.tags = function(source,operator,options) {
	var tags = {},
		tagArray = [],
		orderedTags= [],
		cnt = 0;
	source(function(tiddler,title) {
		var t, length;
		if(tiddler && tiddler.fields.tags) {
			for(t=0, length=tiddler.fields.tags.length; t<length; t++) {
				tags[tiddler.fields.tags[t]] = cnt++;
			}
		}
	});
	if(operator.suffix === "ordered") {
		// Convert 'tags' into an array of {key:value} objects
		$tw.utils.each(tags,function(cnt,tag) {
			tagArray.push({tag:tag, cnt:cnt})
		})

		// Sort the array by 'cnt' in ascending order
		tagArray.sort(function(a,b) {
			return a.cnt - b.cnt;
		});

		// Convert to simple array
		$tw.utils.each(tagArray,function(item) {
			orderedTags.push(item.tag)
		})
		return orderedTags;
	}
	return Object.keys(tags);
};

})();
