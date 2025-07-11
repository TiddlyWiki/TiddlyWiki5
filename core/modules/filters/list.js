/*\
title: $:/core/modules/filters/list.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddlers whose title is listed in the operand tiddler

\*/

"use strict";

/*
Export our filter function
*/
exports.list = function(source,operator,options) {
	let results = [];
	const tr = $tw.utils.parseTextReference(operator.operand);
	const currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	const list = options.wiki.getTiddlerList(tr.title || currTiddlerTitle,tr.field,tr.index);
	if(operator.prefix === "!") {
		source((tiddler,title) => {
			if(!list.includes(title)) {
				results.push(title);
			}
		});
	} else {
		results = list;
	}
	return results;
};
