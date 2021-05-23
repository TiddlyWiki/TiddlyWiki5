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

exports["application/x-tiddler-html-div"] = function(text,fields) {
	return [deserializeTiddlerDiv(text,fields)];
};

exports["application/json"] = function(text,fields) {
	var incoming,
		results = [];
	try {
		incoming = JSON.parse(text);
	} catch(e) {
		incoming = [{
			title: "JSON error: " + e,
			text: ""
		}]
	}
	if(!$tw.utils.isArray(incoming)) {
		incoming = [incoming];
	}
	for(var t=0; t<incoming.length; t++) {
		var incomingFields = incoming[t],
			fields = {};
		for(var f in incomingFields) {
			if(typeof incomingFields[f] === "string") {
				fields[f] = incomingFields[f];
			}
		}
		results.push(fields);
	}
	return results;
};

/*
Parse an HTML file into tiddlers. There are three possibilities:
# A TiddlyWiki classic HTML file containing `text/x-tiddlywiki` tiddlers
# A TiddlyWiki5 HTML file containing `text/vnd.tiddlywiki` tiddlers
# An ordinary HTML file
*/
exports["text/html"] = function(text,fields) {
	var results = [];
	// Check if we've got an old-style store area
	var storeAreaMarkerRegExp = /<div id=["']?storeArea['"]?( style=["']?display:none;["']?)?>/gi,
		storeAreaMatch = storeAreaMarkerRegExp.exec(text);
	if(storeAreaMatch) {
		// If so, we've got tiddlers in classic TiddlyWiki format or unencrypted old-style TW5 format
		results.push.apply(results,deserializeStoreArea(text,storeAreaMarkerRegExp.lastIndex,!!storeAreaMatch[1],fields));
	}
	// Check for new-style store areas
	var newStoreAreaMarkerRegExp = /<script class="tiddlywiki-tiddler-store" type="([^"]*)">/gi,
		newStoreAreaMatch = newStoreAreaMarkerRegExp.exec(text),
		haveHadNewStoreArea = !!newStoreAreaMatch;
	while(newStoreAreaMatch) {
		results.push.apply(results,deserializeNewStoreArea(text,newStoreAreaMarkerRegExp.lastIndex,newStoreAreaMatch[1],fields));
		newStoreAreaMatch = newStoreAreaMarkerRegExp.exec(text);
	}
	// Return if we had either an old-style or a new-style store area
	if(storeAreaMatch || haveHadNewStoreArea) {
		return results;
	}
	// Otherwise, check whether we've got an encrypted file
	var encryptedStoreArea = $tw.utils.extractEncryptedStoreArea(text);
	if(encryptedStoreArea) {
		// If so, attempt to decrypt it using the current password
		return $tw.utils.decryptStoreArea(encryptedStoreArea);
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

function deserializeNewStoreArea(text,storeAreaEnd,type,fields) {
	var endOfScriptRegExp = /<\/script>/gi;
	endOfScriptRegExp.lastIndex = storeAreaEnd;
	var match = endOfScriptRegExp.exec(text);
	if(match) {
		var scriptContent = text.substring(storeAreaEnd,match.index);
		return $tw.wiki.deserializeTiddlers(type,scriptContent);
	} else {
		return [];
	}
}

function deserializeStoreArea(text,storeAreaEnd,isTiddlyWiki5,fields) {
	var results = [],
		endOfDivRegExp = /(<\/div>\s*)/gi,
		startPos = storeAreaEnd,
		defaultType = isTiddlyWiki5 ? undefined : "text/x-tiddlywiki";
	endOfDivRegExp.lastIndex = startPos;
	var match = endOfDivRegExp.exec(text);
	while(match) {
		var endPos = endOfDivRegExp.lastIndex,
			tiddlerFields = deserializeTiddlerDiv(text.substring(startPos,endPos),fields,{type: defaultType});
		if(!tiddlerFields) {
			break;
		}
		$tw.utils.each(tiddlerFields,function(value,name) {
			if(typeof value === "string") {
				tiddlerFields[name] = $tw.utils.htmlDecode(value);
			}
		});
		if(tiddlerFields.text !== null) {
			results.push(tiddlerFields);
		}
		startPos = endPos;
		match = endOfDivRegExp.exec(text);
	}
	return results;
}

/*
Utility function to parse an old-style tiddler DIV in a *.tid file. It looks like this:

<div title="Title" creator="JoeBloggs" modifier="JoeBloggs" created="201102111106" modified="201102111310" tags="myTag [[my long tag]]">
<pre>The text of the tiddler (without the expected HTML encoding).
</pre>
</div>

Note that the field attributes are HTML encoded, but that the body of the <PRE> tag is not encoded.

When these tiddler DIVs are encountered within a TiddlyWiki HTML file then the body is encoded in the usual way.
*/
var deserializeTiddlerDiv = function(text /* [,fields] */) {
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
	var startRegExp = /^\s*<div\s+([^>]*)>(\s*<pre>)?/gi,
		endRegExp,
		match = startRegExp.exec(text);
	if(match) {
		// Old-style DIVs don't have the <pre> tag
		if(match[2]) {
			endRegExp = /<\/pre>\s*<\/div>\s*$/gi;
		} else {
			endRegExp = /<\/div>\s*$/gi;
		}
		var endMatch = endRegExp.exec(text);
		if(endMatch) {
			// Extract the text
			result.text = text.substring(match.index + match[0].length,endMatch.index);
			// Process the attributes
			var attrRegExp = /\s*([^=\s]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
				attrMatch;
			do {
				attrMatch = attrRegExp.exec(match[1]);
				if(attrMatch) {
					var name = attrMatch[1];
					var value = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
					result[name] = value;
				}
			} while(attrMatch);
			return result;
		}
	}
	return undefined;
};

})();
