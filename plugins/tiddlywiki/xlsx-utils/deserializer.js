/*\
title: $:/plugins/tiddlywiki/xlsx-utils/deserializer.js
type: application/javascript
module-type: tiddlerdeserializer

XLSX file deserializer

\*/

"use strict";

/*
Parse an XLSX file into tiddlers
*/
exports["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] = function(text,fields) {
	// Collect output tiddlers in an array
	var results = [],
		XLSXImporter = require("$:/plugins/tiddlywiki/xlsx-utils/importer.js").XLSXImporter,
		importer = new XLSXImporter({
			text: text,
			wiki: $tw.wiki
		});
	// Return the output tiddlers
	return importer.getResults();
};
