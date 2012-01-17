/*\
title: js/TiddlerOutput.js

Functions concerned with parsing representations of tiddlers

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js"),
	util = require("util");

var tiddlerOutput = exports;

// Utility function to convert a tags string array into a TiddlyWiki-style quoted tags string
var stringifyTags = function(tags) {
	var results = [];
	for(var t=0; t<tags.length; t++) {
		if(tags[t].indexOf(" ") !== -1) {
			results.push("[[" + tags[t] + "]]");
		} else {
			results.push(tags[t]);
		}
	}
	return results.join(" ");
};

/*
Output a tiddler as a .tid file
*/
var outputTiddler = function(tid) {
	var result = [],
		outputAttribute = function(name,value) {
		result.push(name + ": " + value + "\n");
	},
		fields = tid.getFields();
	for(var t in fields) {
		switch(t) {
			case "text":
				// Ignore the text field
				break;
			case "tags":
				// Output tags as a list
				outputAttribute(t,tiddlerOutput.stringifyTags(fields.tags));
				break;
			case "modified":
			case "created":
				// Output dates in YYYYMMDDHHMM
				outputAttribute(t,utils.convertToYYYYMMDDHHMM(fields[t]));
				break;
			default:
				// Output other attributes raw
				outputAttribute(t,fields[t]);
				break;
		}
	}
	result.push("\n");
	result.push(fields.text);
	return result.join("");
};

/*
Output a tiddler as an HTML <DIV>
out - array to push the output strings
tid - the tiddler to be output
The fields are in the order title, creator, modifier, created, modified, tags, followed by any others
*/
var outputTiddlerDiv = function(tid) {
	var result = [],
		fields = tid.getFields(),
		text = fields.text,
		outputAttribute = function(name,transform) {
			if(name in fields) {
				var value = fields[name];
				if(transform)
					value = transform(value);
				result.push(" " + name + "=\"" + value + "\"");
				delete fields[name];
			}
		};
	if(fields.text) {
		delete fields.text;
	}
	result.push("<div");
	// Output the standard attributes in the correct order
	outputAttribute("title");
	outputAttribute("creator");
	outputAttribute("modifier");
	outputAttribute("created", function(v) {return utils.convertToYYYYMMDDHHMM(v);});
	outputAttribute("modified", function(v) {return utils.convertToYYYYMMDDHHMM(v);});
	outputAttribute("tags", function(v) {return stringifyTags(v);});
	// Output any other attributes
	for(var t in fields) {
		outputAttribute(t,null,true);
	}
	result.push(">\n<pre>");
	result.push(utils.htmlEncode(text));
	result.push("</pre>\n</div>");
	return result.join("");
};

tiddlerOutput.register = function(store) {
	store.registerTiddlerSerializer(".tid","application/x-tiddler",outputTiddler);
	store.registerTiddlerSerializer(".tiddler","application/x-tiddler-html-div",outputTiddlerDiv);
};

})();
