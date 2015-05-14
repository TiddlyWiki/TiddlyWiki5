/*\
title: $:/core/modules/macros/csvtiddlers.js
type: application/javascript
module-type: macro

Macro to output tiddlers matching a filter to CSV

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "csvtiddlers";

exports.params = [
	{name: "filter"},
	{name: "format"},
];

/*
Run the macro
*/
exports.run = function(filter,format) {
	var self = this,
		tiddlers = this.wiki.filterTiddlers(filter),
		tiddler,
		fields = [],
		t,f;
	// Collect all the fields
	for(t=0;t<tiddlers.length; t++) {
		tiddler = this.wiki.getTiddler(tiddlers[t]);
		for(f in tiddler.fields) {
			if(fields.indexOf(f) === -1) {
				fields.push(f);
			}
		}
	}
	// Sort the fields and bring the standard ones to the front
	fields.sort();
	"title text modified modifier created creator".split(" ").reverse().forEach(function(value,index) {
		var p = fields.indexOf(value);
		if(p !== -1) {
			fields.splice(p,1);
			fields.unshift(value)
		}
	});
	// Output the column headings
	var output = [], row = [];
	fields.forEach(function(value) {
		row.push(quoteAndEscape(value))
	});
	output.push(row.join(","));
	// Output each tiddler
	for(var t=0;t<tiddlers.length; t++) {
		row = [];
		tiddler = this.wiki.getTiddler(tiddlers[t]);
			for(f=0; f<fields.length; f++) {
				row.push(quoteAndEscape(tiddler ? tiddler.getFieldString(fields[f]) || "" : ""));
			}
		output.push(row.join(","));
	}
	return output.join("\n");
};

function quoteAndEscape(value) {
	return "\"" + value.replace(/"/mg,"\"\"") + "\"";
}

})();
