/*\
title: $:/core/modules/filters/contains.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.contains = function(source,operator,options) {
	var results = [],
		fieldname = operator.suffix || "list";
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(tiddler) {
				var list = tiddler.getFieldList(fieldname);
				if(list.indexOf(operator.operand) === -1) {
					results.push(title);
				}
			} else {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler) {
				var list = tiddler.getFieldList(fieldname);
				if(list.indexOf(operator.operand) !== -1) {
					results.push(title);
				}
			}
		});
	}
	return results;
};
