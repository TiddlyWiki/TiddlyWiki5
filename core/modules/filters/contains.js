/*\
title: $:/core/modules/filters/contains.js
type: application/javascript
module-type: filteroperator

Filter operator for finding values in array fields
\*/

"use strict";

/*
Export our filter function
*/
exports.contains = function(source,operator,options) {
	const results = [];
	const operands = operator.operands || [];
	const fieldname = operator.suffix || operands[1] || "list";
	const flagsString = operands[2] || "";
	const flags = flagsString.split(",").map(f => f.trim().toLowerCase());
	const invert = operator.prefix === "!";
	// we get the title or list of titles to check for from the first operand
	const operandTitles = $tw.utils.parseStringArray(operands[0] || "");
	if(flags.includes("listed")) { // we use findListingsOfTiddler lookup if requested
		const intermediateSets = operandTitles.map(title => 
			new Set(options.wiki.findListingsOfTiddler(title, fieldname))
		);
		source((tiddler,title) => {
			let hasTitle;
			if(flags.includes("some")) {
				hasTitle = intermediateSets.some(set => set.has(title));
			} else {
				hasTitle = intermediateSets.every(set => set.has(title));
			}
			if(hasTitle !== invert) {
				results.push(title);
			}
		});
	} else { // original algorithm
		source((tiddler,title) => {
			if(tiddler) {
				const list = tiddler.getFieldList(fieldname);
				let hasTitle;
				if(flags.includes("some")) {
					hasTitle = operandTitles.some(searchTitle => 
						list.indexOf(searchTitle) !== -1
					);
				} else {
					hasTitle = operandTitles.every(searchTitle => 
						list.indexOf(searchTitle) !== -1
					);
				}
				if(hasTitle !== invert) {
					results.push(title);
				}
			} else if(invert) {
				results.push(title);
			}
		});
	}
	return results;
};