/*\
title: $:/core/modules/filters/images.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the images used in image widgets in a tiddler

\*/

"use strict";

/*
Export our filter function
*/
exports.images = function(source,operator,options) {
	const results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerImages(title));
	});
	return results.makeTiddlerIterator(options.wiki);
};
