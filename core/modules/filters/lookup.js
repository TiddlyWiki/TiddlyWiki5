/*\
title: $:/core/modules/filters/lookup.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.lookup = function(source,operator,options) {
	var results = [],
		suffixes = operator.suffixes || [],
		defaultSuffix = suffixes[0] ? (suffixes[0][0] || "") : "",
		indexSuffix = (suffixes[1] && suffixes[1][0] === "index") ? true : false,
		target;
	if(operator.operands.length == 2) {
		target = operator.operands[1]
	} else {
		target = indexSuffix ? "0": "text";
	}
	if(indexSuffix) {
		source(function(tiddler,title) {
			var data = options.wiki.extractTiddlerDataItem(operator.operands[0]+title,target,defaultSuffix);
			results.push(data);
		});
	} else {
		source(function(tiddler,title) {
			var value = defaultSuffix;
			var targetTiddler = options.wiki.getTiddler(operator.operands[0]+title);
			if(targetTiddler && targetTiddler.getFieldString(target)) {
				value = targetTiddler.getFieldString(target);
			}
			results.push(value);
		});
	}
	return results;
};
