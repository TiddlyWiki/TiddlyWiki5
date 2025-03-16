/*\
title: $:/plugins/tiddlywiki/xlsx-utils/importer.js
type: application/javascript
module-type: library

Class to import an Excel file

\*/

"use strict";

var DEFAULT_IMPORT_SPEC_TITLE = "$:/config/plugins/tiddlywiki/xlsx-utils/default-import-spec";

var XLSX = require("$:/plugins/tiddlywiki/xlsx-utils/xlsx.js"),
	JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js");

var XLSXImporter = function(options) {
	this.wiki = options.wiki;
	this.filename = options.filename;
	this.text = options.text;
	this.importSpec = options.importSpec || this.wiki.getTiddlerText(DEFAULT_IMPORT_SPEC_TITLE);
	this.logger = new $tw.utils.Logger("xlsx-utils");
	this.results = [];
	if(JSZip) {
		this.processWorkbook();		
	}
};

XLSXImporter.prototype.getResults = function() {
	return this.results;
};

XLSXImporter.prototype.processWorkbook = function() {
	// Read the workbook
	if(this.filename) {
		this.workbook = XLSX.readFile(this.filename);	
	} else if(this.text) {
		this.workbook = XLSX.read(this.text,{type:"base64"});
	}
	// Read the root import specification
	this.rootImportSpec = this.wiki.getTiddler(this.importSpec);
	if(this.rootImportSpec) {
		// Iterate through the sheets specified in the list field
		$tw.utils.each(this.rootImportSpec.fields.list || [],this.processSheet.bind(this));
	}
};

XLSXImporter.prototype.processSheet = function(sheetImportSpecTitle) {
	// Get the sheet import specifier
	this.sheetImportSpec = this.wiki.getTiddler(sheetImportSpecTitle);
	if(this.sheetImportSpec) {
		this.sheetName = this.sheetImportSpec.fields["import-sheet-name"];
		this.sheet = this.workbook.Sheets[this.sheetName];
		if(!this.sheet) {
			this.logger.alert("Missing sheet '" + this.sheetName + "'");
		} else {
			// Get the size of the sheet
			this.sheetSize = this.measureSheet(this.sheet);
			// Read the column names from the first row
			this.columnsByName = this.findColumns(this.sheet,this.sheetSize);
			// Iterate through the rows
			for(this.row=this.sheetSize.startRow+1; this.row<=this.sheetSize.endRow; this.row++) {
				// Iterate through the row import specifiers
				$tw.utils.each(this.sheetImportSpec.fields.list || [],this.processRow.bind(this));					
			}
		}
	}
};

XLSXImporter.prototype.processRow = function(rowImportSpecTitle) {
	this.rowImportSpec = this.wiki.getTiddler(rowImportSpecTitle);
	if(this.rowImportSpec) {
		this.tiddlerFields = {};
		this.skipTiddler = false;
		// Determine the type of row
		this.rowType = this.rowImportSpec.fields["import-row-type"] || "by-field";
		switch(this.rowType) {
			case "by-column":
				this.processRowByColumn();
				break;
			case "by-field":
				this.processRowByField();
				break;
		}
		// Save the tiddler if not skipped
		if(!this.skipTiddler) {
			if(!this.tiddlerFields.title) {
				this.logger.alert("Missing title field for " + JSON.stringify(this.tiddlerFields));
			}
			this.results.push(this.tiddlerFields);								
		}
	}
};

XLSXImporter.prototype.processRowByColumn = function() {
	var self = this;
	// Iterate through the columns for the row
	$tw.utils.each(this.columnsByName,function(index,name) {
		var cell = self.sheet[XLSX.utils.encode_cell({c: self.columnsByName[name], r: self.row})];
		name = name.toLowerCase();
		if(cell && cell.w && $tw.utils.isValidFieldName(name)) {
			self.tiddlerFields[name] = cell.w;		
		}
	});
	// Skip the tiddler entirely if it doesn't have a title
	if(!this.tiddlerFields.title) {
		this.skipTiddler = true;
	}
};

XLSXImporter.prototype.processRowByField = function() {
	// Iterate through the fields for the row
	$tw.utils.each(this.rowImportSpec.fields.list || [],this.processField.bind(this));
};

XLSXImporter.prototype.processField = function(fieldImportSpecTitle) {
	var fieldImportSpec = this.wiki.getTiddler(fieldImportSpecTitle);
	if(fieldImportSpec) {
		var fieldName = fieldImportSpec.fields["import-field-name"],
			value;
		switch(fieldImportSpec.fields["import-field-source"]) {
			case "column":
				var columnName = fieldImportSpec.fields["import-field-column"],
					cell = this.sheet[XLSX.utils.encode_cell({c: this.columnsByName[columnName], r: this.row})];
				if(cell) {
					switch(fieldImportSpec.fields["import-field-type"] || "string") {
						case "date":
							if(cell.t === "n") {
								value = $tw.utils.stringifyDate(new Date((cell.v - (25567 + 2)) * 86400 * 1000));
							}
							break;
						case "number":
							value = cell.v.toString();
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
		value = (value || "").trim();
		if(value === "") {
			if((fieldImportSpec.fields["import-field-skip-tiddler-if-blank"] || "").trim().toLowerCase() === "yes") {
				this.skipTiddler = true;
			}
			if(fieldImportSpec.fields["import-field-replace-blank"]) {
				value = fieldImportSpec.fields["import-field-replace-blank"];
			}
		}
		if(fieldImportSpec.fields["import-field-prefix"]) {
			value = fieldImportSpec.fields["import-field-prefix"] + value;
		}
		if(fieldImportSpec.fields["import-field-suffix"]) {
			value = value + fieldImportSpec.fields["import-field-suffix"];
		}
		switch(fieldImportSpec.fields["import-field-list-op"] || "none") {
			case "none":
				this.tiddlerFields[fieldName] = value;
				break;
			case "append":
				var list = $tw.utils.parseStringArray(this.tiddlerFields[fieldName] || "");
				$tw.utils.pushTop(list,value)
				this.tiddlerFields[fieldName] = list;
				break;
		}
	}
}

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
