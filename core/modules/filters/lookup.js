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
			var targetTitle = operator.operands[0] + title;
			var data = options.wiki.extractTiddlerDataItem(targetTitle,target,defaultSuffix);
			results.push(data);
		});
	} else {
		source(function(tiddler,title) {
			var targetTitle = operator.operands[0] + title;
			var targetTiddler = options.wiki.getTiddler(targetTitle);
			if(targetTiddler) {
				var value = targetTiddler.getFieldString(target);
				if(value == "" && defaultSuffix !== "") {
					value = defaultSuffix;
				}
				results.push(value);
			}
		});
	}
	return results;
};

})();
