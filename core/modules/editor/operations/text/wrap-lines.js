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
	var prefix = event.paramObject.prefix || "",
		suffix = event.paramObject.suffix || "";
	if($tw.utils.endsWith(operation.text.substring(0,operation.selStart), prefix + "\n") &&
			$tw.utils.startsWith(operation.text.substring(operation.selEnd), "\n" + suffix)) {
		// Selected text is already surrounded by prefix and suffix: Remove them
		// Cut selected text plus prefix and suffix
		operation.cutStart = operation.selStart - (prefix.length + 1);
		operation.cutEnd = operation.selEnd + suffix.length + 1;
		// Also cut the following newline (if there is any)
		if (operation.text[operation.cutEnd] === "\n") {
			operation.cutEnd++;
		}
		// Replace with selection
		operation.replacement = operation.text.substring(operation.selStart,operation.selEnd);
		// Select text that was in between prefix and suffix
		operation.newSelStart = operation.cutStart;
		operation.newSelEnd = operation.selEnd - (prefix.length + 1);
	} else {
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
	}
};

})();
