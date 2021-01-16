/*\
title: $:/core/modules/filters/lookup.js
type: application/javascript
module-type: filteroperator

Filter operator that looks up values via a title prefix

[lookup:<defaultvalue>:<field OR index>[<prefix>],[<field-name OR index-name>]]

Prepends the prefix to the selected items and returns the specified 
field or index value. If the 2nd suffix does not exist, it defaults to field.
If the second operand is missing it defaults to "text" for fields, and "0" for indexes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
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
			title = operator.operands[0] + title;
			data = options.wiki.extractTiddlerDataItem(title,target);
			if(data) {
				results.push(data);
			} else {
				results.push(defaultSuffix);
			}
		});
	} else {
		source(function(tiddler,title) {
			title = operator.operands[0] + title;
			tiddler = options.wiki.getTiddler(title);
			if(tiddler) {
				var value = tiddler.getFieldString(target, defaultSuffix);
				if(value) {
					results.push(value);
				} else {
					results.push(defaultSuffix);
				}
			}
		});
	}
	return results;
};

})();
