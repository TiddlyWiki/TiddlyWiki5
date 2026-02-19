/*\
title: $:/core/modules/filters/filter.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.filter = function(source,operator,options) {
	var filterFn = options.wiki.compileFilter(operator.operand),
		results = [],
		target = operator.prefix !== "!";
	source(function(tiddler,title) {
		var list = filterFn.call(options.wiki,options.wiki.makeTiddlerIterator([title]),options.widget.makeFakeWidgetWithVariables({
			"currentTiddler": "" + title,
			"..currentTiddler": options.widget.getVariable("currentTiddler",{defaultValue:""})
		}));
		if((list.length > 0) === target) {
			results.push(title);
		}
	});
	return results;
};
