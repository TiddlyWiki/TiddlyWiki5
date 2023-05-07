/*\
title: $:/core/modules/editor/operations/text/insert-text.js
type: application/javascript
module-type: texteditoroperation

Text editor operation insert text at the caret position. If there is a selection it is replaced.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["insert-text"] = function(event,operation) {
	operation.replacement = event.paramObject.text;
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart + operation.replacement.length;
	operation.newSelEnd = operation.newSelStart;
};

})();
