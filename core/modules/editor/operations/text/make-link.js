/*\
title: $:/core/modules/editor/operations/text/make-link.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to make a link

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["make-link"] = function(event,operation) {
	if(operation.selection) {
		operation.replacement = "[[" + operation.selection + "|" + event.paramObject.text + "]]";
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	} else {
		operation.replacement = "[[" + event.paramObject.text + "]]";
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
	}
	operation.newSelStart = operation.selStart + operation.replacement.length;
	operation.newSelEnd = operation.newSelStart;
};

})();
