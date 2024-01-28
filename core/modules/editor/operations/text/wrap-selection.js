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
	var o = operation,
		prefix = event.paramObject.prefix,
		prefixLength = prefix.length,
		suffix = event.paramObject.suffix,
		suffixLength = suffix.length,
		trimSelection = event.paramObject.trimSelection || "no",
		selLength = o.selEnd - o.selStart;

	var trailingSpaceAt = function(sel) {
		// returns "yes", "start", "end", "no"
		var _start,
			_end,
			result;
		// this evaluation takes the user configuration into account!
		switch (trimSelection) {
			case "end":
				result = (sel.trimEnd().length !== selLength) ? "end" : "no";
			break;
			case "yes":
				_start = sel.trimStart().length !== selLength;
				_end = sel.trimEnd().length !== selLength;
				result = (_start && _end) ? "yes" : (_start) ? "start" : (_end) ? "end" : "no";
			break;
			case "start":
				result = (sel.trimStart().length !== selLength) ? "start" : "no";
			break;
			default:
				result = "no";
			break;
		}
		return result;
	}

	function togglePrefixSuffix() {
		// this was the only behavour till TW v5.3.3
		if(o.text.substring(o.selStart - prefixLength, o.selStart + suffixLength) === prefix + suffix) {
			// Remove the prefix and suffix
			o.cutStart = o.selStart - prefixLength;
			o.cutEnd = o.selEnd + suffixLength;
			o.replacement = "";
			o.newSelStart = o.cutStart;
			o.newSelEnd = o.newSelStart;
		} else {
			// Wrap the cursor instead
			o.cutStart = o.selStart;
			o.cutEnd = o.selEnd;
			o.replacement = prefix + suffix;
			o.newSelStart = o.selStart + prefixLength;
			o.newSelEnd = o.newSelStart;
		}
	}

	// options: prefixLen, suffixLen
	function removePrefixSuffix(options) {
		options = options || {};
		var prefixLen = options.prefixLen || 0;
		var suffixLen = options.suffixLen || 0;

		o.cutStart = o.selStart - prefixLen;
		o.cutEnd = o.selEnd + suffixLen;
		o.replacement = (prefixLen || suffixLen) ? o.selection : o.selection.substring(prefixLength, o.selection.length - suffixLength);
		o.newSelStart = o.cutStart;
		o.newSelEnd = o.cutStart + o.replacement.length;
	}

	function addPrefixSuffix() {
		// remove trailing space if requested
		switch (trailingSpaceAt(o.selection)) {
			case "no":
				// has no trailing spaces
				o.cutStart = o.selStart;
				o.cutEnd = o.selEnd;
				o.replacement = prefix + o.selection + suffix;
				o.newSelStart = o.selStart;
				o.newSelEnd = o.selStart + o.replacement.length;
			break;
			case "yes":
				o.cutStart = o.selEnd - (o.selection.trimStart().length);
				o.cutEnd = o.selection.trimEnd().length + o.selStart;
				o.replacement = prefix + o.selection.trim() + suffix;
				o.newSelStart = o.cutStart;
				o.newSelEnd = o.cutStart + o.replacement.length;
			break;
			case "start":
				o.cutStart = o.selEnd - (o.selection.trimStart().length);
				o.cutEnd = o.selEnd;
				o.replacement = prefix + o.selection.trimStart() + suffix;
				o.newSelStart = o.cutStart;
				o.newSelEnd = o.cutStart + o.replacement.length;
			break;
			case "end":
				o.cutStart = o.selStart;
				o.cutEnd = o.selection.trimEnd().length + o.selStart;
				o.replacement = prefix + o.selection.trimEnd() + suffix;
				o.newSelStart = o.selStart;
				o.newSelEnd = o.selStart + o.replacement.length;
			break;
		}
	}


	if(o.selStart === o.selEnd) {
		// No selection; Create prefix and suffix. Set cursor between them: ""|""
		togglePrefixSuffix();
	} else if(	o.text.substring(o.selStart, o.selStart + prefixLength) === prefix &&
				o.text.substring(o.selEnd - suffixLength,o.selEnd) === suffix) {
		// Prefix and suffix are already present, so remove them
		removePrefixSuffix();
	} else if(	o.text.substring(o.selStart - prefixLength, o.selStart) === prefix &&
				o.text.substring(o.selEnd, o.selEnd + suffixLength) === suffix) {
		// Prefix and suffix are present BUT not selected -> remove them
		removePrefixSuffix({"prefixLen": prefixLength, "suffixLen": suffixLength});
	} else {
		// Add the prefix and suffix
		addPrefixSuffix();
	}
};

})();
