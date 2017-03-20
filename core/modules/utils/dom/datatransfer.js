/*\
title: $:/core/modules/utils/dom/datatransfer.js
type: application/javascript
module-type: utils

Browser data transfer utilities, used with the clipboard and drag and drop

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.importDataTransfer = function(dataTransfer,fallbackTitle,callback) {
	// Try each provided data type in turn
	for(var t=0; t<importDataTypes.length; t++) {
		if(!$tw.browser.isIE || importDataTypes[t].IECompatible) {
			// Get the data
			var dataType = importDataTypes[t];
				var data = dataTransfer.getData(dataType.type);
			// Import the tiddlers in the data
			if(data !== "" && data !== null) {
				if($tw.log.IMPORT) {
					console.log("Importing data type '" + dataType.type + "', data: '" + data + "'")
				}
				var tiddlerFields = dataType.toTiddlerFieldsArray(data,fallbackTitle);
				callback(tiddlerFields);
				return;
			}
		}
	}
};

var importDataTypes = [
	{type: "text/vnd.tiddler", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return parseJSONTiddlers(data,fallbackTitle);
	}},
	{type: "URL", IECompatible: true, toTiddlerFieldsArray: function(data,fallbackTitle) {
		// Check for tiddler data URI
		var match = decodeURIComponent(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return parseJSONTiddlers(match[1],fallbackTitle);
		} else {
			return [{text: data}]; // As URL string
		}
	}},
	{type: "text/x-moz-url", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		// Check for tiddler data URI
		var match = decodeURIComponent(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return parseJSONTiddlers(match[1],fallbackTitle);
		} else {
			return [{text: data}]; // As URL string
		}
	}},
	{type: "text/html", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{text: data}];
	}},
	{type: "text/plain", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{text: data}];
	}},
	{type: "Text", IECompatible: true, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{text: data}];
	}},
	{type: "text/uri-list", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{text: data}];
	}}
];

function parseJSONTiddlers(json,fallbackTitle) {
	var data = JSON.parse(json);
	if(!$tw.utils.isArray(data)) {
		data = [data];
	}
	data.forEach(function(fields) {
		fields.title = fields.title || fallbackTitle;
	});
	return data;
};

})();
