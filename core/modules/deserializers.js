/*\
title: $:/core/modules/deserializers.js
type: application/javascript
module-type: tiddlerdeserializer

Functions to deserialise tiddlers from a block of text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Utility function to parse an old-style tiddler DIV in a *.tid file. It looks like this:

<div title="Title" creator="JoeBloggs" modifier="JoeBloggs" created="201102111106" modified="201102111310" tags="myTag [[my long tag]]">
<pre>The text of the tiddler (without the expected HTML encoding).
</pre>
</div>

Note that the field attributes are HTML encoded, but that the body of the <PRE> tag is not encoded.

When these tiddler DIVs are encountered within a TiddlyWiki HTML file then the body is encoded in the usual way.
*/
var parseTiddlerDiv = function(text /* [,fields] */) {
	// Slot together the default results
	var result = {};
	if(arguments.length > 1) {
		for(var f=1; f<arguments.length; f++) {
			var fields = arguments[f];
			for(var t in fields) {
				result[t] = fields[t];		
			}
		}
	}
	// Parse the DIV body
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
		return result;
	} else {
		return undefined;
	}
};

exports["application/x-tiddler-html-div"] = function(text,fields) {
	return [parseTiddlerDiv(text,fields)];
};

exports["application/json"] = function(text,fields) {
	var tiddlers = JSON.parse(text),
		result = [],
		getKnownFields = function(tid) {
			var fields = {};
			"title text created creator modified modifier type tags".split(" ").forEach(function(value) {
				if(tid[value] !== null) {
					fields[value] = tid[value];
				}
			});
			return fields;
		};
	for(var t=0; t<tiddlers.length; t++) {
		result.push(getKnownFields(tiddlers[t]));
	}
	return result;
};

/*
Parse an HTML file into tiddlers. There are three possibilities:
# A TiddlyWiki classic HTML file containing `application/vnd.tiddlywiki2` tiddlers
# A TiddlyWiki5 HTML file containing `application/vnd.tiddlywiki` tiddlers
# An ordinary HTML file
*/
exports["text/html"] = function(text,fields) {
	// Check if we've got a store area
	var storeAreaMarkerRegExp = /<div id=["']?storeArea['"]?( style=["']?display:none;["']?)?>/gi,
		match = storeAreaMarkerRegExp.exec(text);
	if(match) {
		// If so, it's either a classic TiddlyWiki file or a TW5 file
		return deserializeTiddlyWikiFile(text,storeAreaMarkerRegExp.lastIndex,!!match[1],fields);
	} else {
		// It's not a TiddlyWiki so we'll return the entire HTML file as a tiddler
		return deserializeHtmlFile(text,fields);
	}
};

function deserializeHtmlFile(text,fields) {
	var result = {};
	$tw.utils.each(fields,function(value,name) {
		result[name] = value;
	});
	result.text = text;
	result.type = "text/html";
	return [result];
}

function deserializeTiddlyWikiFile(text,storeAreaEnd,isTiddlyWiki5,fields) {
	var results = [],
		endOfDivRegExp = /(<\/div>\s*)/gi,
		startPos = storeAreaEnd,
		defaultType = isTiddlyWiki5 ? "application/vnd.tiddlywiki": "application/vnd.tiddlywiki2";
	endOfDivRegExp.lastIndex = startPos;
	var match = endOfDivRegExp.exec(text);
	while(match) {
		var endPos = endOfDivRegExp.lastIndex,
			tiddlerFields = parseTiddlerDiv(text.substring(startPos,endPos),fields,{type: defaultType});
		if(!tiddlerFields) {
			break;
		}
		if(tiddlerFields.text !== null) {
			tiddlerFields.text = $tw.utils.htmlDecode(tiddlerFields.text);
			results.push(tiddlerFields);
		}
		startPos = endPos;
		match = endOfDivRegExp.exec(text);
	}
	return results;
}

})();
