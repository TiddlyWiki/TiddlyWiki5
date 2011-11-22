/*
Various static utility functions concerned with parsing and generating representations of tiddlers and
other objects.

This file is a bit of a dumping ground; the expectation is that most of these functions will be refactored.
*/

var argParser = require("./ArgParser.js");

var tiddlerUtils = exports;

/*
Parse a tiddler given its mimetype, and merge the results into a hashmap of tiddler fields.

A file extension can be passed as a shortcut for the mimetype, as shown in tiddlerUtils.fileExtensionMappings.
For example ".txt" file extension is mapped to the "text/plain" mimetype.

Special processing to extract embedded metadata is applied to some mimetypes.
*/

tiddlerUtils.parseTiddler = function(text,type,fields) {
	if(fields === undefined) {
		var fields = {};
	}
	// Map extensions to mimetpyes
	var fileExtensionMapping = tiddlerUtils.fileExtensionMappings[type];
	if(fileExtensionMapping)
		type = fileExtensionMapping;
	// Invoke the parser for the specified mimetype
	var parser = tiddlerUtils.parseTiddlerByMimeType[type];
	if(parser) {
		return parser(text,fields);
	}
	return fields;
}

tiddlerUtils.fileExtensionMappings = {
	".txt": "text/plain",
	".html": "text/html",
	".tiddler": "application/x-tiddler-html-div",
	".tid": "application/x-tiddler",
	".js": "application/javascript"
}

tiddlerUtils.parseTiddlerByMimeType = {
	"text/plain": function(text,fields) {
		fields.text = text;
		return fields;
	},
	"text/html": function(text,fields) {
		fields.text = text;
		return fields;
	},
	"application/x-tiddler-html-div": function(text,fields) {
		fields = tiddlerUtils.parseTiddlerDiv(text,fields);
		return fields;
	},
	"application/x-tiddler": function(text,fields) {
		var split = text.indexOf("\n\n");
		if(split === -1) {
			split = text.length;
		}
		fields = tiddlerUtils.parseMetaDataBlock(text.substr(0,split),fields);
		fields.text = text.substr(split + 2);
		return fields;
	},
	"application/javascript": function(text,fields) {
		fields.text = text;
		return fields;
	}
}

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
tiddlerUtils.parseMetaDataBlock = function(metaData,fields) {
	if(fields === undefined) {
		var fields = {};
	}
	metaData.split("\n").forEach(function(line) {
		var p = line.indexOf(":");
		if(p !== -1) {
			var field = line.substr(0, p).trim();
			var value = line.substr(p+1).trim();
			fields[field] = tiddlerUtils.parseMetaDataItem(field,value);
		}
	});
	return fields;
}

/*
Parse an old-style tiddler DIV. It looks like this:

<div title="Title" creator="JoeBloggs" modifier="JoeBloggs" created="201102111106" modified="201102111310" tags="myTag [[my long tag]]">
<pre>The text of the tiddler (without the expected HTML encoding).
</pre>
</div>

Note that the field attributes are HTML encoded, but that the body of the <PRE> tag is not.
*/
tiddlerUtils.parseTiddlerDiv = function(text,fields) {
	if(fields === undefined) {
		var fields = {};
	}
	var divRegExp = /^\s*<div\s+([^>]*)>((?:.|\n)*)<\/div>\s*$/gi;
	var subDivRegExp = /^(?:\s*<pre>)((?:.|\n)*)(?:<\/pre>\s*)$/gi;
	var attrRegExp = /\s*([^=\s]+)\s*=\s*"([^"]*)"/gi;
	var match = divRegExp.exec(text);
	if(match) {
		var subMatch = subDivRegExp.exec(match[2]); // Body of the <DIV> tag
		if(subMatch) {
			fields.text = subMatch[1];
		} else {
			fields.text = match[2]; 
		}
		do {
			var attrMatch = attrRegExp.exec(match[1]);
			if(attrMatch) {
				var name = attrMatch[1];
				var value = attrMatch[2];
				fields[name] = tiddlerUtils.parseMetaDataItem(name,value);
			}
		} while(attrMatch);
	}
	return fields;	
}

// Output a tiddler as an HTML <DIV>
// out - array to push the output strings
// tid - the tiddler to be output
// options - options:
//		omitPrecedingLineFeed - determines if a linefeed is inserted between the <PRE> tag and the text
tiddlerUtils.outputTiddlerDiv = function(out,tid,options) {
	var result = [];
	var outputAttribute = function(name,value) {
		result.push(" " + name + "=\"" + value + "\"");
	};
	result.push("<div");
	for(var t in tid.fields) {
		switch(t) {
			case "text":
				// Ignore the text field
				break;
			case "tags":
				// Output tags as a list
				outputAttribute(t,tiddlerUtils.stringifyTags(tid.fields.tags));
				break;
			case "modified":
			case "created":
				// Output dates in YYYYMMDDHHMMSS
				outputAttribute(t,tiddlerUtils.convertToYYYYMMDDHHMM(tid.fields[t]));
				break;
			default:
				// Output other attributes raw
				outputAttribute(t,tid.fields[t]);
				break;
		}
	}
	result.push(">\n<pre>");
	if(!(options && options.omitPrecedingLineFeed))
		result.push("\n");
	result.push(tiddlerUtils.htmlEncode(tid.fields.text));
	result.push("</pre>\n</div>");
	out.push(result.join(""));
}

tiddlerUtils.stringifyTags = function(tags) {
	var results = [];
	for(var t=0; t<tags.length; t++) {
		if(tags[t].indexOf(" ") !== -1) {
			results.push("[[" + tags[t] + "]]");
		} else {
			results.push(tags[t]);
		}
	}
	return results.join(" ");
}

/*
Parse a single metadata field/value pair and return the value as the appropriate data type
*/
tiddlerUtils.parseMetaDataItem = function(field,value) {
	var result;
	switch(field) {
		case "modified":
		case "created":
			result = tiddlerUtils.convertFromYYYYMMDDHHMMSS(value);
			break;
		case "tags":
			var parser = new argParser.ArgParser(value,{noNames: true});
			result = parser.getValuesByName("","");
			break;
		default:
			result = value;
			break;
	}
	return result;
}

// Pad a string to a certain length with zeros
tiddlerUtils.zeroPad = function(n,d)
{
	var s = n.toString();
	if(s.length < d)
		s = "000000000000000000000000000".substr(0,d-s.length) + s;
	return s;
};

// Convert a date to local YYYYMMDDHHMM string format
tiddlerUtils.convertToLocalYYYYMMDDHHMM = function(date)
{
	return date.getFullYear() + tiddlerUtils.zeroPad(date.getMonth()+1,2) + tiddlerUtils.zeroPad(date.getDate(),2) + tiddlerUtils.zeroPad(date.getHours(),2) + tiddlerUtils.zeroPad(date.getMinutes(),2);
};

// Convert a date to UTC YYYYMMDDHHMM string format
tiddlerUtils.convertToYYYYMMDDHHMM = function(date)
{
	return date.getUTCFullYear() + tiddlerUtils.zeroPad(date.getUTCMonth()+1,2) + tiddlerUtils.zeroPad(date.getUTCDate(),2) + tiddlerUtils.zeroPad(date.getUTCHours(),2) + tiddlerUtils.zeroPad(date.getUTCMinutes(),2);
};

// Convert a date to UTC YYYYMMDD.HHMMSSMMM string format
tiddlerUtils.convertToYYYYMMDDHHMMSSMMM = function(date)
{
	return date.getUTCFullYear() + tiddlerUtils.zeroPad(date.getUTCMonth()+1,2) + tiddlerUtils.zeroPad(date.getUTCDate(),2) + "." + tiddlerUtils.zeroPad(date.getUTCHours(),2) + tiddlerUtils.zeroPad(date.getUTCMinutes(),2) + tiddlerUtils.zeroPad(date.getUTCSeconds(),2) + tiddlerUtils.zeroPad(date.getUTCMilliseconds(),3) +"0";
};

// Create a date from a UTC YYYYMMDDHHMM format string
tiddlerUtils.convertFromYYYYMMDDHHMM = function(d)
{
	d = d?d.replace(/[^0-9]/g, ""):"";
	return tiddlerUtils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,12));
};

// Create a date from a UTC YYYYMMDDHHMMSS format string
tiddlerUtils.convertFromYYYYMMDDHHMMSS = function(d)
{
	d = d?d.replace(/[^0-9]/g, ""):"";
	return tiddlerUtils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,14));
};

// Create a date from a UTC YYYYMMDDHHMMSSMMM format string
tiddlerUtils.convertFromYYYYMMDDHHMMSSMMM = function(d)
{
	d = d ? d.replace(/[^0-9]/g, "") : "";
	return new Date(Date.UTC(parseInt(d.substr(0,4),10),
			parseInt(d.substr(4,2),10)-1,
			parseInt(d.substr(6,2),10),
			parseInt(d.substr(8,2)||"00",10),
			parseInt(d.substr(10,2)||"00",10),
			parseInt(d.substr(12,2)||"00",10),
			parseInt(d.substr(14,3)||"000",10)));
};

// Convert & to "&amp;", < to "&lt;", > to "&gt;" and " to "&quot;"
tiddlerUtils.htmlEncode = function(s)
{
	return s.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;");
};

// Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
tiddlerUtils.htmlDecode = function(s)
{
	return s.replace(/&lt;/mg,"<").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
};

