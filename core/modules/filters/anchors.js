/*\
title: $:/core/modules/filters/anchors.js
type: application/javascript
module-type: filteroperator

Filter operator for returning anchors that the input tiddler links to in the specified target tiddler.

Usage: [<sourceTiddler>anchors[TargetTitle]]

Returns anchors (not tiddler titles) that <sourceTiddler> uses when linking to TargetTitle.

\*/

"use strict";

/*
Export our filter function
*/
exports.anchors = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var marks = options.wiki.getTiddlerAnchorLinks(title,operator.operand);
		$tw.utils.each(marks,function(mark) {
			$tw.utils.pushTop(results,mark);
		});
	});
	return results;
};
