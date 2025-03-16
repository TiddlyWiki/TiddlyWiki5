/*\
title: $:/plugins/tiddlywiki/markdown-legacy/editor-operations/make-markdown-link.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to make a markdown link

\*/

"use strict";

exports["make-markdown-link"] = function(event,operation) {
	if(operation.selection) {
		if(event.paramObject.text.indexOf("://") !== -1) {
			operation.replacement = "[" + operation.selection + "](" + event.paramObject.text + ")";
		} else {
			operation.replacement = "[" + operation.selection + "](#" + event.paramObject.text.replaceAll(" ", "%20") + ")";
		}
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	} else {
		if(event.paramObject.text.indexOf("://") !== -1) {
			operation.replacement = "<" + event.paramObject.text + ">";
		} else {
			operation.replacement = "[](#" + event.paramObject.text.replaceAll(" ", "%20") + ")";
		}
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	}
	operation.newSelStart = operation.selStart + operation.replacement.length;
	operation.newSelEnd = operation.newSelStart;
};
