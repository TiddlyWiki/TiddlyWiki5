/*\
title: $:/core/modules/filters/list-children.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the descendents of a tiddler listed in the "list" field

\*/

"use strict";

/*
Export our filter function
*/
exports["list-children"] = function(source,operator,options) {
	const children = {};
	const processTiddler = function(title) {
		const tiddler = options.wiki.getTiddler(title);
		if(tiddler && !$tw.utils.hop(children,title)) {
			children[title] = true;
			const list = options.wiki.getTiddlerList(title,operator.operand);
			list.forEach((listItem) => {
				if(!$tw.utils.hop(children,listItem)) {
					processTiddler(listItem);
				}
			});
		}
	};
	source((tiddler,title) => {
		processTiddler(title);
	});
	return Object.keys(children);
};
