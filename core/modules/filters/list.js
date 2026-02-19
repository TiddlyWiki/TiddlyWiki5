/*\
title: $:/core/modules/filters/list.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.list = function(source,operator,options) {
	var results = [],
		tr = $tw.utils.parseTextReference(operator.operand),
		currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler"),
		list = options.wiki.getTiddlerList(tr.title || currTiddlerTitle,tr.field,tr.index);
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(list.indexOf(title) === -1) {
				results.push(title);
			}
		});
	} else {
		results = list;
	}
	return results;
};
