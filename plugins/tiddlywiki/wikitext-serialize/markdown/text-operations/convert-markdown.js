/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/text-operations/convert-markdown.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to convert markdown to wikitext

\*/

"use strict";

exports["convert-markdown"] = function(event, operation) {
	if(!$tw.utils.markdownTextToWikiAST) {
		return;
	}
	
	// Get the text to convert (selection or entire text)
	var text;
	if(operation.selStart !== operation.selEnd) {
		// Use selection
		text = operation.text.substring(operation.selStart, operation.selEnd);
	} else {
		// Use entire text
		text = operation.text;
	}
	
	if(!text) {
		return;
	}
	
	try {
		var wikiAST = $tw.utils.markdownTextToWikiAST(text);
		var wikitext = $tw.utils.serializeWikitextParseTree(wikiAST);
		
		// Replace the selection or entire text
		operation.replacement = wikitext;
		if(operation.selStart !== operation.selEnd) {
			// Replace selection
			operation.cutStart = operation.selStart;
			operation.cutEnd = operation.selEnd;
		} else {
			// Replace entire text
			operation.cutStart = 0;
			operation.cutEnd = operation.text.length;
		}
		operation.newSelStart = operation.cutStart;
		operation.newSelEnd = operation.cutStart + wikitext.length;
	} catch(e) {
		console.error("Error converting markdown:", e);
	}
};
