/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/text-operations/format-wikitext.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to format/prettify wikitext

\*/

"use strict";

exports["format-wikitext"] = function(event, operation) {
	if(!$tw.utils.serializeWikitextParseTree) {
		return;
	}
	
	// Get the text to format (selection or entire text)
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
		// Parse wikitext to AST - this strips leading whitespace automatically
		var parser = $tw.wiki.parseText("text/vnd.tiddlywiki", text);
		if(!parser || !parser.tree) {
			return;
		}
		
		// Serialize back to wikitext (this reformats it)
		var formattedWikitext = $tw.utils.serializeWikitextParseTree(parser.tree).trimEnd();
		
		// Replace the selection or entire text
		operation.replacement = formattedWikitext;
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
		operation.newSelEnd = operation.cutStart + formattedWikitext.length;
	} catch(e) {
		console.error("Error formatting wikitext:", e);
	}
};
