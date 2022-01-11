/*\
title: $:/core/modules/editor/operations/text/wrap-lines.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to wrap the selected lines with a prefix and suffix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["wrap-lines"] = function(event,operation) {
	var prefix = operation.paramObject.prefix || "",
		suffix = operation.paramObject.suffix || "";
	// Cut just past the preceding line break, or the start of the text
	operation.cutStart = $tw.utils.findPrecedingLineBreak(operation.text,operation.selStart);
	// Cut to just past the following line break, or to the end of the text
	operation.cutEnd = $tw.utils.findFollowingLineBreak(operation.text,operation.selEnd);
	// Add the prefix and suffix
	operation.replacement = prefix + "\n" +
				operation.text.substring(operation.cutStart,operation.cutEnd) + "\n" +
				suffix + "\n";
	operation.newSelStart = operation.cutStart + prefix.length + 1;
	operation.newSelEnd = operation.newSelStart + (operation.cutEnd - operation.cutStart);
};

})();
