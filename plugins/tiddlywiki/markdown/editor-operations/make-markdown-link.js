/*\
title: $:/plugins/tiddlywiki/markdown/editor-operations/make-markdown-link.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to make a markdown link

\*/

"use strict";

exports["make-markdown-link"] = function(event,operation) {
	var rx = /[()<>\\]/g, rs = '\\$&';

	if(operation.selection) {
		var desc = operation.selection.replace(/[\[\]\\]/g, rs);

		if(event.paramObject.text.indexOf("://") !== -1) {
			operation.replacement = "[" + desc + "](" + event.paramObject.text.replace(/[()\\]/g, rs) + ")";
		} else {
			operation.replacement = "[" + desc + "](<#" + event.paramObject.text.replace(rx, rs) + ">)";
		}
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	} else {
		if(event.paramObject.text.indexOf("://") !== -1) {
			operation.replacement = "<" + event.paramObject.text.replace(/[<>]/g, function(m, offset, str) {
				return encodeURI(m);
			}) + ">";
		} else {
			operation.replacement = "[](<#" + event.paramObject.text.replace(rx, rs) + ">)";
		}
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	}
	operation.newSelStart = operation.selStart + operation.replacement.length;
	operation.newSelEnd = operation.newSelStart;
};
