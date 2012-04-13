/*\
title: js/TiddlerInput.js

Functions concerned with parsing representations of tiddlers

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js"),
	Tiddler = require("./Tiddler.js").Tiddler,
	util = require("util");

var tiddlerInput = exports;

/*
Utility function to parse a block of metadata and merge the results into a hashmap of tiddler fields.

The block consists of newline delimited lines consisting of the field name, a colon, and then the value. For example:

title: Safari
modifier: blaine
created: 20110211110700
modified: 20110211131020
tags: browsers issues
creator: psd
*/
var parseMetaDataBlock = function(metaData,fields) {
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

var inputTiddlerPlain = function(text,fields) {
	fields.text = text;
	return [fields];
};

var inputTiddlerJavaScript = function(text,fields) {
	var headerCommentRegExp = /^\/\*\\\n((?:^[^\n]*\n)+?)(^\\\*\/$\n?)/mg,
		match = headerCommentRegExp.exec(text);
	fields.text = text;
	if(match) {
		fields = parseMetaDataBlock(match[1],fields);
	}
	return [fields];
};

var inputTiddlerDiv = function(text,fields) {
	return [parseTiddlerDiv(text,fields)];
};

var inputTiddler = function(text,fields) {
	var split = text.indexOf("\n\n");
	if(split !== -1) {
		fields.text = text.substr(split + 2);
	}
	if(split === -1) {
		split = text.length;
	}
	fields = parseMetaDataBlock(text.substr(0,split),fields);
	return [fields];
};

var inputTiddlerJSON = function(text,fields) {
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
};

var inputTiddlyWiki = function(text,fields) {
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
				tiddlerFields.text = utils.htmlDecode(tiddlerFields.text);
				results.push(tiddlerFields);
			}
			startPos = endPos;
			match = endOfDivRegExp.exec(text);
		}
	}
	return results;
};

// Given a reference to a DOM node, return the tiddlers stored in the immediate child nodes
var inputTiddlerDOM = function(node) {
	var extractTextTiddler = function(node) {
			var e = node.firstChild;
			while(e && e.nodeName.toLowerCase() !== "pre") {
				e = e.nextSibling;
			}
			var title = node.getAttribute ? node.getAttribute("title") : null;
			if(e && title) {
				var i,
					attrs = node.attributes,
					tiddler = {
						text: utils.htmlDecode(e.innerHTML)
					};
				for(i=attrs.length-1; i >= 0; i--) {
					if(attrs[i].specified) {
						var value = attrs[i].value,
							name = attrs[i].name;
						if(!Tiddler.isStandardField(name)) {
							value = utils.unescapeLineBreaks(value);
						}
						tiddler[name] = value;
					}
				}
				return tiddler;
			} else {
				return null;
			}
		},
		extractModuleTiddler = function(node) {
			if(node.hasAttribute && node.hasAttribute("data-tiddler-title")) {
				var text = node.innerHTML,
					s = text.indexOf("{"),
					e = text.lastIndexOf("}");
				if(s !== -1 && e !== -1) {
					text = text.substring(s+1,e-1);
				}
				return {
					title: node.getAttribute("data-tiddler-title"),
					text: text,
					type: "application/javascript"
				};
			} else {
				return null;
			}
		},
		t,tiddlers = [];
	for(t = 0; t < node.childNodes.length; t++) {
			var tiddler = extractTextTiddler(node.childNodes[t]);
			tiddler = tiddler || extractModuleTiddler(node.childNodes[t]);
			if(tiddler) {
				tiddlers.push(tiddler);
			}
	}
	return tiddlers;
};

tiddlerInput.register = function(store) {
	store.registerTiddlerDeserializer(".txt","text/plain",inputTiddlerPlain);
	store.registerTiddlerDeserializer(".js","application/javascript",inputTiddlerJavaScript);
	store.registerTiddlerDeserializer(".tiddler","application/x-tiddler-html-div",inputTiddlerDiv);
	store.registerTiddlerDeserializer(".tid","application/x-tiddler",inputTiddler);
	store.registerTiddlerDeserializer(".json","application/json",inputTiddlerJSON);
	store.registerTiddlerDeserializer(".tiddlywiki","application/x-tiddlywiki",inputTiddlyWiki);
	store.registerTiddlerDeserializer("(DOM)","(DOM)",inputTiddlerDOM);
};

})();
