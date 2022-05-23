/*\
title: $:/plugins/tiddlywiki/markdown/editor-operations/make-markdown-link.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to make a markdown link

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["make-markdown-link"] = function(event,operation) {
	if(operation.selection) {
		if(event.paramObject.text.includes("://")) {
			operation.replacement = "[" + operation.selection + "](" + event.paramObject.text + ")";
		} else {
			operation.replacement = "[" + operation.selection + "](#" + event.paramObject.text.replaceAll(" ", "%20") + ")";
		}
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	} else {
		if(event.paramObject.text.includes("://")) {
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

})();
