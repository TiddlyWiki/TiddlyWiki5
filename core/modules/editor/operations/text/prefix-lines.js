/*\
title: $:/core/modules/editor/operations/text/prefix-lines.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to add a prefix to the selected lines

\*/

"use strict";

exports["prefix-lines"] = function(event,operation) {
	var targetCount = parseInt(event.paramObject.count + "",10);
	// Cut just past the preceding line break, or the start of the text
	operation.cutStart = $tw.utils.findPrecedingLineBreak(operation.text,operation.selStart);
	// Cut to just past the following line break, or to the end of the text
	operation.cutEnd = $tw.utils.findFollowingLineBreak(operation.text,operation.selEnd);
	// Compose the required prefix
	var prefix = $tw.utils.repeat(event.paramObject.character,targetCount);
	// Process each line
	var lines = operation.text.substring(operation.cutStart,operation.cutEnd).split(/\r?\n/mg);
	$tw.utils.each(lines,function(line,index) {
		// Remove and count any existing prefix characters
		var count = 0;
		while($tw.utils.startsWith(line,event.paramObject.character)) {
			line = line.substring(event.paramObject.character.length);
			count++;
		}
		// Remove any whitespace
		while(line.charAt(0) === " ") {
			line = line.substring(1);
		}
		// We're done if we removed the exact required prefix, otherwise add it
		if(count !== targetCount) {
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
