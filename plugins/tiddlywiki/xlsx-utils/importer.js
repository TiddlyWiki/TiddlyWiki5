/*\
title: $:/plugins/tiddlywiki/xlsx-utils/importer.js
type: application/javascript
module-type: library

Class to import an Excel file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_IMPORT_SPEC_TITLE = "$:/config/plugins/tiddlywiki/xlsx-utils/default-import-spec";

var XLSX = require("$:/plugins/tiddlywiki/xlsx-utils/xlsx.js"),
	JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js");

var XLSXImporter = function(options) {
	this.filename = options.filename;
	this.text = options.text;
	this.importSpec = options.importSpec || $tw.wiki.getTiddlerText(DEFAULT_IMPORT_SPEC_TITLE);
};

XLSXImporter.prototype.importTiddlers = function() {
	var self = this,
		results = [],
		workbook;
	// Check for the JSZIP plugin
	if(!JSZip) {
		return results;
	}
	// Read the workbook
	if(this.filename) {
		workbook = XLSX.readFile(this.filename);	
	} else if(this.text) {
		workbook = XLSX.read(this.text,{type:"base64"});
	}
	// Read the root import specification
	var rootImportSpec = $tw.wiki.getTiddler(this.importSpec);
	if(rootImportSpec) {
		// Iterate through the sheets specified in the list field
		$tw.utils.each(rootImportSpec.fields.list || [],function(sheetImportSpecTitle) {
			// Get the sheet import specifier
			var sheetImportSpec = $tw.wiki.getTiddler(sheetImportSpecTitle);
			if(sheetImportSpec) {
				var sheetName = sheetImportSpec.fields["import-sheet-name"],
					sheet = workbook.Sheets[sheetName];
				// Get the size of the sheet
				var sheetSize = self.measureSheet(sheet);
				// Read the column names from the first row
				var columnsByName = self.findColumns(sheet,sheetSize);
				// Iterate through the rows
				for(var row=sheetSize.startRow+1; row<=sheetSize.endRow; row++) {
					// Iterate through the row import specifiers
					$tw.utils.each(sheetImportSpec.fields.list || [],function(rowImportSpecTitle) {
						var rowImportSpec = $tw.wiki.getTiddler(rowImportSpecTitle);
						if(rowImportSpec) {
							var tiddlerFields = {};
							// Iterate through the fields for the row
							$tw.utils.each(rowImportSpec.fields.list || [],function(fieldImportSpecTitle) {
								var fieldImportSpec = $tw.wiki.getTiddler(fieldImportSpecTitle);
								if(fieldImportSpec) {
									var fieldName = fieldImportSpec.fields["import-field-name"],
										value;
									switch(fieldImportSpec.fields["import-field-source"]) {
										case "column":
											var columnName = fieldImportSpec.fields["import-field-column"],
												cell = sheet[XLSX.utils.encode_cell({c: columnsByName[columnName], r: row})];
											if(cell) {
												switch(fieldImportSpec.fields["import-field-type"] || "string") {
													case "date":
														if(cell.t === "n") {
															value = $tw.utils.stringifyDate(new Date((cell.v - (25567 + 2)) * 86400 * 1000));
														}
														break;
													case "string":
														// Intentional fall-through
													default:
														value = cell.w;
														break;
												}
											}
											break;
										case "constant":
											value = fieldImportSpec.fields["import-field-value"]
											break;
									}
									if(fieldImportSpec.fields["import-field-prefix"]) {
										value = fieldImportSpec.fields["import-field-prefix"] + value;
									}
									if(fieldImportSpec.fields["import-field-suffix"]) {
										value = value + fieldImportSpec.fields["import-field-suffix"];
									}
									if(fieldImportSpec.fields["import-field-replace-blank"] && (value || "").trim() === "") {
										value = fieldImportSpec.fields["import-field-replace-blank"];
									}
									switch(fieldImportSpec.fields["import-field-list-op"] || "none") {
										case "none":
											tiddlerFields[fieldName] = value;
											break;
										case "append":
											var list = $tw.utils.parseStringArray(tiddlerFields[fieldName] || "");
											$tw.utils.pushTop(list,value)
											tiddlerFields[fieldName] = list;
											break;
									}
								}
							});
							results.push(tiddlerFields);
						}
					});					
				}
			}
		});
	}
	return results;
};

XLSXImporter.prototype.measureSheet = function(sheet) {
	var sheetRange = XLSX.utils.decode_range(sheet["!ref"]);
	return {
		startRow: Math.min(sheetRange.s.r,sheetRange.e.r),
		endRow: Math.max(sheetRange.s.r,sheetRange.e.r),
		startCol: Math.min(sheetRange.s.c,sheetRange.e.c),
		endCol: Math.max(sheetRange.s.c,sheetRange.e.c)
	}
};

XLSXImporter.prototype.findColumns = function(sheet,sheetSize) {
	var columnsByName = {};
	for(var col=sheetSize.startCol; col<=sheetSize.endCol; col++) {
		var cell = sheet[XLSX.utils.encode_cell({c: col, r: sheetSize.startRow})],
			columnName;
		if(cell) {
			columnName = cell.w;
			if(columnName) {
				columnsByName[columnName] = col;							
			}
		}
	}
	return columnsByName;
};

exports.XLSXImporter = XLSXImporter;

})();
