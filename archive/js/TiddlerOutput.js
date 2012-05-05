/*\
title: js/TiddlerOutput.js

Serializers that output tiddlers in a variety of formats.

store.serializeTiddlers(tiddlers,type)

	tiddlers: An array of tiddler objects
	type: The target output type as a file extension like `.tid` or a MIME type like `application/x-tiddler`. If `null` or `undefined` then the best type is chosen automatically

The serializer returns an array of information defining one or more files containing the tiddlers:

	[
		{name: "title.tid", type: "application/x-tiddler", ext: ".tid", data: "xxxxx"},
		{name: "title.jpg", type: "image/jpeg", ext: ".jpg", binary: true, data: "xxxxx"},
		{name: "title.jpg.meta", type: "application/x-tiddler-metadata", ext: ".meta", data: "xxxxx"}
	]

Notes:
* The `type` field is the type of the file, which is not necessrily the same as the type of the tiddler.
* The `binary` field may be omitted if it is not `true`

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js"),
	util = require("util");

var tiddlerOutput = exports;

var outputMetaDataBlock = function(tiddler) {
	var result = [],
		fields = tiddler.getFieldStrings(),
		t;
	for(t=0; t<fields.length; t++) {
		result.push(fields[t].name + ": " + fields[t].value);
	}
	return result.join("\n");
};

/*
Output tiddlers as separate files in their native formats (ie. `.tid` or `.jpg`/`.jpg.meta`)
*/
var outputTiddlers = function(tiddlers) {
	var result = [];
	for(var t=0; t<tiddlers.length; t++) {
		var tiddler = tiddlers[t],
			extension,
			binary = false;
		switch(tiddler.type) {
			case "image/jpeg":
				extension = ".jpg";
				binary = true;
				break;
			case "image/gif":
				extension = ".gif";
				binary = true;
				break;
			case "image/png":
				extension = ".png";
				binary = true;
				break;
			case "image/svg+xml":
				extension = ".svg";
				break;
			default:
				extension = ".tid";
				break;
		}
		if(extension === ".tid") {
			result.push({
				name: tiddler.title + ".tid",
				type: "application/x-tiddler",
				extension: ".tid",
				data: outputMetaDataBlock(tiddler) + "\n\n" + tiddler.text,
				binary: false
			});
		} else {
			result.push({
				name: tiddler.title,
				type: tiddler.type,
				extension: extension,
				data: tiddler.text,
				binary: binary
			});
			result.push({
				name: tiddler.title + ".meta",
				type: "application/x-tiddler-metadata",
				extension: ".meta",
				data: outputMetaDataBlock(tiddler),
				binary: false
			});
		}
	}
	return result;
};

/*
Output an array of tiddlers as HTML <DIV>s
out - array to push the output strings
tid - the tiddler to be output
The fields are in the order title, creator, modifier, created, modified, tags, followed by any others
*/
var outputTiddlerDivs = function(tiddlers) {
	var result = [];
	for(var t=0; t<tiddlers.length; t++) {
		var tiddler = tiddlers[t],
			output = [],
			fieldStrings = tiddler.getFieldStrings();
		output.push("<div");
		for(var f=0; f<fieldStrings.length; f++) {
			output.push(" " + fieldStrings[f].name + "=\"" + fieldStrings[f].value + "\"");
		}
		output.push(">\n<pre>");
		output.push(utils.htmlEncode(tiddler.text));
		output.push("</pre>\n</div>");
		result.push({
			name: tiddler.title,
			type: "application/x-tiddler-html-div",
			extension: ".tiddler",
			data: output.join("")
		});
	}
	return result;
};

tiddlerOutput.register = function(store) {
	store.registerTiddlerSerializer(".tid","application/x-tiddler",outputTiddlers);
	store.registerTiddlerSerializer(".tiddler","application/x-tiddler-html-div",outputTiddlerDivs);
};

})();
