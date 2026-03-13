/*\
title: $:/core/modules/filters/backlinks.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the backlinks from a tiddler.
Supports :anchor suffix to filter by specific anchor.

\*/

"use strict";

/*
Export our filter function
*/
exports.backlinks = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	if(operator.suffix === "anchor") {
		// Return tiddlers that link to the input tiddler with a specific anchor
		source(function(tiddler,title) {
			results.pushTop(options.wiki.getTiddlerAnchorBacklinks(title,operator.operand));
		});
	} else {
		source(function(tiddler,title) {
			results.pushTop(options.wiki.getTiddlerBacklinks(title));
		});
	}
	return results.makeTiddlerIterator(options.wiki);
};
