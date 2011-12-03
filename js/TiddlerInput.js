/*
Functions concerned with parsing representations of tiddlers
*/

/*global require: false, exports: false */
"use strict";

var utils = require("./Utils.js"),
	util = require("util");

var tiddlerInput = exports;

/*
Parse a tiddler given its mimetype, and merge the results into a hashmap of tiddler fields.

A file extension can be passed as a shortcut for the mimetype, as shown in tiddlerUtils.fileExtensionMappings.
For example ".txt" file extension is mapped to the "text/plain" mimetype.

Special processing to extract embedded metadata is applied to some mimetypes.
*/

tiddlerInput.parseTiddlerFile = function(text,type,fields) {
	// Map extensions to mimetpyes
	var fileExtensionMapping = tiddlerInput.fileExtensionMappings[type];
	if(fileExtensionMapping)
		type = fileExtensionMapping;
	// Invoke the parser for the specified mimetype
	var parser = tiddlerInput.parseTiddlerFileByMimeType[type];
	if(!parser)
		parser = tiddlerInput.parseTiddlerFileByMimeType["text/plain"];
	return parser(text,fields);
};

tiddlerInput.fileExtensionMappings = {
	".txt": "text/plain",
	".html": "text/html",
	".tiddler": "application/x-tiddler-html-div",
	".tid": "application/x-tiddler",
	".js": "application/javascript",
	".json": "application/json"
};

tiddlerInput.parseTiddlerFileByMimeType = {
	"text/plain": function(text,fields) {
		fields.text = text;
		return [fields];
	},
	"text/html": function(text,fields) {
		fields.text = text;
		return [fields];
	},
	"application/x-tiddler-html-div": function(text,fields) {
		return [tiddlerInput.parseTiddlerDiv(text,fields)];
	},
	"application/x-tiddler": function(text,fields) {
		var split = text.indexOf("\n\n");
		if(split === -1) {
			split = text.length;
		}
		fields = tiddlerInput.parseMetaDataBlock(text.substr(0,split),fields);
		fields.text = text.substr(split + 2);
		return [fields];
	},
	"application/javascript": function(text,fields) {
		fields.text = text;
		return [fields];
	},
	"application/json": function(text,fields) {
		var tiddlers = JSON.parse(text),
			result = [],
			getKnownFields = function(tid) {
				var fields = {};
				"title text created creator modified modifier type tags".split(" ").forEach(function(value) {
					fields[value] = tid[value];
				});
				return fields;
			};
		for(var t=0; t<tiddlers.length; t++) {
			result.push(getKnownFields(tiddlers[t]));
		}
		return result;
	}
};

/*
Parse a block of metadata and merge the results into a hashmap of tiddler fields.

The block consists of newline delimited lines consisting of the field name, a colon, and then the value. For example:

title: Safari
modifier: blaine
created: 20110211110700
modified: 20110211131020
tags: browsers issues
creator: psd
*/
tiddlerInput.parseMetaDataBlock = function(metaData,fields) {
	var result = {};
	if(fields) {
		for(var t in fields) {
			result[t] = fields[t];
		}
	}
	metaData.split("\n").forEach(function(line) {
		var p = line.indexOf(":");
		if(p !== -1) {
			var field = line.substr(0, p).trim();
			var value = line.substr(p+1).trim();
			result[field] = value;
		}
	});
	return result;
};

/*
Parse an old-style tiddler DIV. It looks like this:

<div title="Title" creator="JoeBloggs" modifier="JoeBloggs" created="201102111106" modified="201102111310" tags="myTag [[my long tag]]">
<pre>The text of the tiddler (without the expected HTML encoding).
</pre>
</div>

Note that the field attributes are HTML encoded, but that the body of the <PRE> tag is not.
*/
tiddlerInput.parseTiddlerDiv = function(text,fields) {
	var result = {};
	if(fields) {
		for(var t in fields) {
			result[t] = fields[t];		
		}
	}
	var divRegExp = /^\s*<div\s+([^>]*)>((?:.|\n)*)<\/div>\s*$/gi,
		subDivRegExp = /^\s*<pre>((?:.|\n)*)<\/pre>\s*$/gi,
		attrRegExp = /\s*([^=\s]+)\s*=\s*"([^"]*)"/gi,
		match = divRegExp.exec(text);
	if(match) {
		var subMatch = subDivRegExp.exec(match[2]); // Body of the <DIV> tag
		if(subMatch) {
			result.text = subMatch[1];
		} else {
			result.text = match[2]; 
		}
		var attrMatch;
		do {
			attrMatch = attrRegExp.exec(match[1]);
			if(attrMatch) {
				var name = attrMatch[1];
				var value = attrMatch[2];
				result[name] = value;
			}
		} while(attrMatch);
	}
	return result;	
};
