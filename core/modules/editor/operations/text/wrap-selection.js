/*\
title: $:/core/modules/editor/operations/text/wrap-selection.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to wrap the selection with the specified prefix and suffix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["wrap-selection"] = function(event,operation) {
	if(operation.selStart === operation.selEnd) {
		// No selection; check if we're within the prefix/suffix
		if(operation.text.substring(operation.selStart - event.paramObject.prefix.length,operation.selStart + event.paramObject.suffix.length) === event.paramObject.prefix + event.paramObject.suffix) {
			// Remove the prefix and suffix
			operation.cutStart = operation.selStart - event.paramObject.prefix.length;
			operation.cutEnd = operation.selEnd + event.paramObject.suffix.length;
			operation.replacement = "";
			operation.newSelStart = operation.cutStart;
			operation.newSelEnd = operation.newSelStart;
		} else {
			// Wrap the cursor instead
			operation.cutStart = operation.selStart;
			operation.cutEnd = operation.selEnd;
			operation.replacement = event.paramObject.prefix + event.paramObject.suffix;
			operation.newSelStart = operation.selStart + event.paramObject.prefix.length;
			operation.newSelEnd = operation.newSelStart;
		}
	} else if(operation.text.substring(operation.selStart,operation.selStart + event.paramObject.prefix.length) === event.paramObject.prefix && operation.text.substring(operation.selEnd - event.paramObject.suffix.length,operation.selEnd) === event.paramObject.suffix) {
		// Prefix and suffix are already present, so remove them
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
		operation.replacement = operation.selection.substring(event.paramObject.prefix.length,operation.selection.length - event.paramObject.suffix.length);
		operation.newSelStart = operation.selStart;
		operation.newSelEnd = operation.selStart + operation.replacement.length;
	} else {
		// Add the prefix and suffix
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
		operation.replacement = event.paramObject.prefix + operation.selection + event.paramObject.suffix;
		operation.newSelStart = operation.selStart;
		operation.newSelEnd = operation.selStart + operation.replacement.length;
	}
};

})();
