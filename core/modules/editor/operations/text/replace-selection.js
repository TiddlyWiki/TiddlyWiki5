/*\
title: $:/core/modules/editor/operations/text/replace-selection.js
type: application/javascript
module-type: texteditoroperation
\*/

"use strict";

exports["replace-selection"] = function(event,operation) {
	operation.replacement = event.paramObject.text;
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};
