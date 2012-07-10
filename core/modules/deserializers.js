/*\
title: $:/core/modules/deserializers.js
type: application/javascript
module-type: tiddlerdeserializer

Plugins to deserialise tiddlers from a block of text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Utility function to parse an old-style tiddler DIV. It looks like this:

<div title="Title" creator="JoeBloggs" modifier="JoeBloggs" created="201102111106" modified="201102111310" tags="myTag [[my long tag]]">
<pre>The text of the tiddler (without the expected HTML encoding).
</pre>
</div>

Note that the field attributes are HTML encoded, but that the body of the <PRE> tag is not.
*/
var parseTiddlerDiv = function(text,fields) {
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

exports["application/x-tiddlywiki"] = function(text,fields) {
	var locateStoreArea = function(tiddlywikidoc) {
			var startSaveArea = '<div id="' + 'storeArea">',
				startSaveAreaRegExp = /<div id=["']?storeArea['"]?>/gi,
				endSaveArea = '</d' + 'iv>',
				endSaveAreaCaps = '</D' + 'IV>',
				posOpeningDiv = tiddlywikidoc.search(startSaveAreaRegExp),
				limitClosingDiv = tiddlywikidoc.indexOf("<"+"!--POST-STOREAREA--"+">");
			if(limitClosingDiv == -1) {
				limitClosingDiv = tiddlywikidoc.indexOf("<"+"!--POST-BODY-START--"+">");
			}
			var start = limitClosingDiv == -1 ? tiddlywikidoc.length : limitClosingDiv,
				posClosingDiv = tiddlywikidoc.lastIndexOf(endSaveArea,start);
			if(posClosingDiv == -1) {
				posClosingDiv = tiddlywikidoc.lastIndexOf(endSaveAreaCaps,start);
			}
			return (posOpeningDiv != -1 && posClosingDiv != -1) ? [posOpeningDiv + startSaveArea.length,posClosingDiv] : null;
		},
		results = [],
		storeAreaPos = locateStoreArea(text);
	if(storeAreaPos) {
		var endOfDivRegExp = /(<\/div>\s*)/gi,
			startPos = storeAreaPos[0];
		endOfDivRegExp.lastIndex = startPos;
		var match = endOfDivRegExp.exec(text);
		while(match && startPos < storeAreaPos[1]) {
			var endPos = endOfDivRegExp.lastIndex,
				tiddlerFields = parseTiddlerDiv(text.substring(startPos,endPos),fields);
			if(tiddlerFields.text !== null) {
				tiddlerFields.text = $tw.utils.htmlDecode(tiddlerFields.text);
				results.push(tiddlerFields);
			}
			startPos = endPos;
			match = endOfDivRegExp.exec(text);
		}
	}
	return results;
};

})();
