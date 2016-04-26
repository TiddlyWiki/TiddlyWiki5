/*\
title: $:/core/modules/editor/operations/text/prefix-lines.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to add a prefix to the selected lines

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["prefix-lines"] = function(event,operation) {
	// Cut just past the preceding line break, or the start of the text
	operation.cutStart = $tw.utils.findPrecedingLineBreak(operation.text,operation.selStart);
	// Cut to just past the following line break, or to the end of the text
	operation.cutEnd = $tw.utils.findFollowingLineBreak(operation.text,operation.selEnd);
	// Process each line
	var lines = operation.text.substring(operation.cutStart,operation.cutEnd).split(/\r?\n/mg);
	$tw.utils.each(lines,function(line,index) {
		// Compose the required prefix
		var prefix = event.paramObject.character.repeat(event.paramObject.count);
		// Check if we already have the required prefix
		if(line.substring(0,prefix.length) === prefix) {
			// If so, remove the prefix
			line = line.substring(prefix.length);
			// Remove any whitespace
			while(line.charAt(0) === " ") {
				line = line.substring(1);
			}
		} else {
			// If we didn't have the prefix, remove any existing prefix characters
			while(line.charAt(0) === event.paramObject.character) {
				line = line.substring(1);
			}
			// Remove any whitespace
			while(line.charAt(0) === " ") {
				line = line.substring(1);
			}
			// Apply the prefix
			line =  prefix + " " + line;
		}
		// Save the modified line
		lines[index] = line;
	});
	// Stitch the replacement text together and set the selection
	operation.replacement = lines.join("\n");
	if(lines.length === 1) {
		operation.newSelStart = operation.cutStart + operation.replacement.length;
		operation.newSelEnd = operation.newSelStart;
	} else {
		operation.newSelStart = operation.cutStart;
		operation.newSelEnd = operation.newSelStart + operation.replacement.length;
	}
};

})();
