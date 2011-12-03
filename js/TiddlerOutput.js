/*
Functions concerned with parsing representations of tiddlers
*/

/*global require: false, exports: false */
"use strict";

var utils = require("./Utils.js");

var tiddlerOutput = exports;

/*
Output a tiddler as a .tid file
*/
tiddlerOutput.outputTiddler = function(tid) {
	var result = [],
		outputAttribute = function(name,value) {
		result.push(name + ": " + value + "\n");
	};
	for(var t in tid.fields) {
		switch(t) {
			case "text":
				// Ignore the text field
				break;
			case "tags":
				// Output tags as a list
				outputAttribute(t,tiddlerOutput.stringifyTags(tid.fields.tags));
				break;
			case "modified":
			case "created":
				// Output dates in YYYYMMDDHHMM
				outputAttribute(t,utils.convertToYYYYMMDDHHMM(tid.fields[t]));
				break;
			default:
				// Output other attributes raw
				outputAttribute(t,tid.fields[t]);
				break;
		}
	}
	result.push("\n");
	result.push(tid.fields.text);
	return result.join("");
};

/*
Output a tiddler as an HTML <DIV>
out - array to push the output strings
tid - the tiddler to be output
The fields are in the order title, creator, modifier, created, modified, tags, followed by any others
*/
tiddlerOutput.outputTiddlerDiv = function(tid) {
	var result = [],
		attributes = {},
		outputAttribute = function(name,transform,dontDelete) {
			if(name in attributes) {
				var value = attributes[name];
				if(transform)
					value = transform(value);
				result.push(" " + name + "=\"" + value + "\"");
				if(!dontDelete) {
					delete attributes[name];
				}
			}
		};
	for(var t in tid.fields) {
		attributes[t] = tid.fields[t];
	}
	if(attributes.text) {
		delete attributes.text;
	}
	result.push("<div");
	// Output the standard attributes in the correct order
	outputAttribute("title");
	outputAttribute("creator");
	outputAttribute("modifier");
	outputAttribute("created", function(v) {return utils.convertToYYYYMMDDHHMM(v)});
	outputAttribute("modified", function(v) {return utils.convertToYYYYMMDDHHMM(v)});
	outputAttribute("tags", function(v) {return tiddlerOutput.stringifyTags(v)});
	// Output any other attributes
	for(t in attributes) {
		outputAttribute(t,null,true);
	}
	result.push(">\n<pre>");
	result.push(utils.htmlEncode(tid.fields.text));
	result.push("</pre>\n</div>");
	return result.join("");
};

tiddlerOutput.stringifyTags = function(tags) {
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


