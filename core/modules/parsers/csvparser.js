/*\
title: $:/core/modules/parsers/csvparser.js
type: application/javascript
module-type: parser

The CSV text parser processes CSV files into a table wrapped in a scrollable widget

\*/

"use strict";

var CsvParser = function(type,text,options) {
	// Special handler for tab-delimited files
	if (type === 'text/tab-delimited-values' && !options.separator) {
		options.separator = "\t";
	}
	
	// Table framework
	this.tree = [{
		"type": "scrollable", "children": [{
			"type": "element", "tag": "table", "children": [{
				"type": "element", "tag": "tbody", "children": []
			}], "attributes": {
				"class": {"type": "string", "value": "tc-csv-table"}
			}
		}]
	}];
	// Split the text into lines
	var lines = $tw.utils.parseCsvString(text, options),
		tag = "th";
	var maxColumns = 0;
	$tw.utils.each(lines, function(columns) {
		maxColumns = Math.max(columns.length, maxColumns);
	});
	
	for(var line=0; line<lines.length; line++) {
		var columns = lines[line];
		var row = {
			"type": "element", "tag": "tr", "children": []
		};
		for(var column=0; column<maxColumns; column++) {
			row.children.push({
				"type": "element", "tag": tag, "children": [{
					"type": "text",
					"text": columns[column] || ''
				}]
			});
		}
		tag = "td";
		this.tree[0].children[0].children[0].children.push(row);
	}
	this.source = text;
	this.type = type;
};

exports["text/csv"] = CsvParser;
exports["text/tab-delimited-values"] = CsvParser;
