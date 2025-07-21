/*\
title: $:/core/modules/filters/search.js
type: application/javascript
module-type: filteroperator

Filter operator for searching for the text in the operand tiddler

\*/

"use strict";

/*
Export our filter function
*/
exports.search = function(source,operator,options) {
	const invert = operator.prefix === "!";
	if(operator.suffixes) {
		const hasFlag = function(flag) {
			return (operator.suffixes[1] || []).includes(flag);
		};
		let excludeFields = false;
		const fieldList = operator.suffixes[0] || [];
		const firstField = fieldList[0] || "";
		const firstChar = firstField.charAt(0);
		let fields;
		if(firstChar === "-") {
			fields = [firstField.slice(1)].concat(fieldList.slice(1));
			excludeFields = true;
		} else if(fieldList[0] === "*") {
			fields = [];
			excludeFields = true;
		} else {
			fields = [...fieldList];
		}
		return options.wiki.search(operator.operand,{
			source,
			invert,
			field: fields,
			excludeField: excludeFields,
			some: hasFlag("some"),
			caseSensitive: hasFlag("casesensitive"),
			literal: hasFlag("literal"),
			whitespace: hasFlag("whitespace"),
			anchored: hasFlag("anchored"),
			regexp: hasFlag("regexp"),
			words: hasFlag("words")
		});
	} else {
		return options.wiki.search(operator.operand,{
			source,
			invert
		});
	}
};
