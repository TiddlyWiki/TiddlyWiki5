/*\
title: $:/core/modules/parsers/csvparser.js
type: application/javascript
module-type: parser

The CSV text parser processes CSV files into a table wrapped in a scrollable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CsvParser = function(type,text,options) {
	// Table framework
	this.tree = [{
		"type": "scrollable", "children": [{
			"type": "element", "tag": "table", "children": [{
				"type": "element", "tag": "tbody", "children": []
			}], "attributes": {
				"class": {"type": "string", "value": "tw-csv-table"}
			}
		}]
	}];
	// Split the text into lines
	var lines = text.split(/\r?\n/mg),
		tag = "th";
	for(var line=0; line<lines.length; line++) {
		var lineText = lines[line];
		if(lineText) {
			var row = {
					"type": "element", "tag": "tr", "children": []
				};
			var columns = lineText.split(",");
			for(var column=0; column<columns.length; column++) {
				row.children.push({
						"type": "element", "tag": tag, "children": [{
							"type": "text",
							"text": columns[column]
						}]
					});
			}
			tag = "td";
			this.tree[0].children[0].children[0].children.push(row);
		}
	}
};

exports["text/csv"] = CsvParser;

})();

