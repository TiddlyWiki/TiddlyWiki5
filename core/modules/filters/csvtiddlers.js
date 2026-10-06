/*\
title: $:/core/modules/filters/csvtiddlers.js
type: application/javascript
module-type: filteroperator

Filter operator to output tiddlers matching a filter to CSV

\*/

"use strict";

function quoteAndEscape(value) {
	return "\"" + value.replace(/"/mg,"\"\"") + "\"";
}

exports.csvtiddlers = function(source,operator,options) {
	let fields = [],
		titles = [],
		tiddlers = [];
	source((tiddler,title) => {
		tiddlers.push(tiddler);
		titles.push(title);
	});
	for(const tiddler of tiddlers) {
		if(tiddler) {
			for(const f in tiddler.fields) {
				if(!fields.includes(f)) {
					fields.push(f);
				}
			}
		}
	}
	// Sort the fields and bring the standard ones to the front
	fields.sort();
	"title text modified modifier created creator".split(" ").reverse().forEach((value,index) => {
		const p = fields.indexOf(value);
		if(p !== -1) {
			fields.splice(p,1);
			fields.unshift(value);
		}
	});
	// Output the column headings
	let output = [], row = [];
	fields.forEach(function(value) {
		row.push(quoteAndEscape(value));
	});
	output.push(row.join(","));
	// Output each tiddler
	for(const tiddler of tiddlers) {
		row = [];
		if(tiddler) {
			for(const field of fields) {
				row.push(quoteAndEscape(tiddler ? tiddler.getFieldString(field) || "" : ""));
			}
		}
		output.push(row.join(","));
	}
	return [output.join("\n")];
};