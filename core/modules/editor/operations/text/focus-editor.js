/*\
title: $:/core/modules/editor/operations/text/focus-editor.js
type: application/javascript
module-type: texteditoroperation

Just focus the editor

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["focus-editor"] = function(event,operation) {
	if(operation.selection) {
		operation.replacement = operation.selection;
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	} else {
		operation.replacement = "";
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	}
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selEnd;
};

})();
