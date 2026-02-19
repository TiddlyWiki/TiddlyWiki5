/*\
title: $:/core/modules/editor/operations/text/replace-all.js
type: application/javascript
module-type: texteditoroperation
\*/

"use strict";

exports["replace-all"] = function(event,operation) {
	operation.cutStart = 0;
	operation.cutEnd = operation.text.length;
	operation.replacement = event.paramObject.text;
	operation.newSelStart = 0;
	operation.newSelEnd = operation.replacement.length;
};
