/*\
title: $:/plugins/wikilabs/debug/editor-operation/select-range.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to select a range of text by character position

\*/

"use strict";

exports["select-range"] = function(event,operation) {
	var start = parseInt(event.paramObject.start,10) || 0;
	var end = parseInt(event.paramObject.end,10) || start;
	// Replace the range with itself so executeTextOperation sets the selection
	operation.replacement = operation.text.substring(start,end);
	operation.cutStart = start;
	operation.cutEnd = end;
	operation.newSelStart = start;
	operation.newSelEnd = end;
};
