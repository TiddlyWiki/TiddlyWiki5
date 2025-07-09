/*\
title: $:/core/modules/deserializers.js
type: application/javascript
module-type: tiddlerdeserializer

Functions to deserialise tiddlers from a block of text

\*/

"use strict";

exports["application/x-tiddler-html-div"] = function(text,fields) {
	return [deserializeTiddlerDiv(text,fields)];
};

exports["application/json"] = function(text,fields) {
	const results = [];
	let incoming = $tw.utils.parseJSONSafe(text,(err) => {
		return [{
			title: `JSON error: ${err}`,
			text: ""
		}];
	});
	if(!$tw.utils.isArray(incoming)) {
		incoming = [incoming];
	}
	for(let t = 0;t < incoming.length;t++) {
		const incomingFields = incoming[t];
		var fields = {};
		for(const f in incomingFields) {
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
	const results = [];
	// Check if we've got an old-style store area
	const storeAreaMarkerRegExp = /<div id=["']?storeArea['"]?( style=["']?display:none;["']?)?>/gi;
	const storeAreaMatch = storeAreaMarkerRegExp.exec(text);
	if(storeAreaMatch) {
		// If so, we've got tiddlers in classic TiddlyWiki format or unencrypted old-style TW5 format
		results.push.apply(results,deserializeStoreArea(text,storeAreaMarkerRegExp.lastIndex,!!storeAreaMatch[1],fields));
	}
	// Check for new-style store areas
	const newStoreAreaMarkerRegExp = /<script class="tiddlywiki-tiddler-store" type="([^"]*)">/gi;
	let newStoreAreaMatch = newStoreAreaMarkerRegExp.exec(text);
	const haveHadNewStoreArea = !!newStoreAreaMatch;
	while(newStoreAreaMatch) {
		results.push.apply(results,deserializeNewStoreArea(text,newStoreAreaMarkerRegExp.lastIndex,newStoreAreaMatch[1],fields));
		newStoreAreaMatch = newStoreAreaMarkerRegExp.exec(text);
	}
	// Return if we had either an old-style or a new-style store area
	if(storeAreaMatch || haveHadNewStoreArea) {
		return results;
	}
	// Otherwise, check whether we've got an encrypted file
	const encryptedStoreArea = $tw.utils.extractEncryptedStoreArea(text);
	if(encryptedStoreArea) {
		// If so, attempt to decrypt it using the current password
		return $tw.utils.decryptStoreArea(encryptedStoreArea);
	} else {
		// It's not a TiddlyWiki so we'll return the entire HTML file as a tiddler
		return deserializeHtmlFile(text,fields);
	}
};

function deserializeHtmlFile(text,fields) {
	const result = {};
	$tw.utils.each(fields,(value,name) => {
		result[name] = value;
	});
	result.text = text;
	result.type = "text/html";
	return [result];
}

function deserializeNewStoreArea(text,storeAreaEnd,type,fields) {
	const endOfScriptRegExp = /<\/script>/gi;
	endOfScriptRegExp.lastIndex = storeAreaEnd;
	const match = endOfScriptRegExp.exec(text);
	if(match) {
		const scriptContent = text.substring(storeAreaEnd,match.index);
		return $tw.wiki.deserializeTiddlers(type,scriptContent);
	} else {
		return [];
	}
}

function deserializeStoreArea(text,storeAreaEnd,isTiddlyWiki5,fields) {
	const results = [];
	const endOfDivRegExp = /(<\/div>\s*)/gi;
	let startPos = storeAreaEnd;
	const defaultType = isTiddlyWiki5 ? undefined : "text/x-tiddlywiki";
	endOfDivRegExp.lastIndex = startPos;
	let match = endOfDivRegExp.exec(text);
	while(match) {
		const endPos = endOfDivRegExp.lastIndex;
		var tiddlerFields = deserializeTiddlerDiv(text.substring(startPos,endPos),fields,{type: defaultType});
		if(!tiddlerFields) {
			break;
		}
		$tw.utils.each(tiddlerFields,(value,name) => {
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
	const result = {};
	if(arguments.length > 1) {
		for(let f = 1;f < arguments.length;f++) {
			const fields = arguments[f];
			for(const t in fields) {
				result[t] = fields[t];
			}
		}
	}
	// Parse the DIV body
	const startRegExp = /^\s*<div\s+([^>]*)>(\s*<pre>)?/gi;
	let endRegExp;
	const match = startRegExp.exec(text);
	if(match) {
		// Old-style DIVs don't have the <pre> tag
		if(match[2]) {
			endRegExp = /<\/pre>\s*<\/div>\s*$/gi;
		} else {
			endRegExp = /<\/div>\s*$/gi;
		}
		const endMatch = endRegExp.exec(text);
		if(endMatch) {
			// Extract the text
			result.text = text.substring(match.index + match[0].length,endMatch.index);
			// Process the attributes
			const attrRegExp = /\s*([^=\s]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
			let attrMatch;
			do {
				attrMatch = attrRegExp.exec(match[1]);
				if(attrMatch) {
					const name = attrMatch[1];
					const value = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
					result[name] = value;
				}
			} while(attrMatch);
			return result;
		}
	}
	return undefined;
};
