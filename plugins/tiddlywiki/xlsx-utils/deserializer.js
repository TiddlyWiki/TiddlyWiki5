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
	const results = [];
	const {XLSXImporter} = require("$:/plugins/tiddlywiki/xlsx-utils/importer.js");
	const importer = new XLSXImporter({
		text,
		wiki: $tw.wiki
	});
	// Return the output tiddlers
	return importer.getResults();
};
