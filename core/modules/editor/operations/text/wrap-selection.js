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
		suffix = event.paramObject.suffix,
		trimSelection = event.paramObject.trimSelection || "no",
		selLength = o.selEnd - o.selStart;

	// This function detects, if trailing spaces are part of the selection __and__ if the user wants to handle them
	// Returns "yes", "start", "end", "no" (default)
	//	yes .. there are trailing spaces at both ends
	//	start .. there are trailing spaces at the start
	//	end .. there are trailing spaces at the end
	//	no .. no trailing spaces are taken into account
	var trailingSpaceAt = function(sel) {
		var _start,
			_end,
			result;
		// trimSelection is a user parameter, which this evaluations takes into account
		switch(trimSelection) {
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
		if(o.text.substring(o.selStart - prefix.length, o.selStart + suffix.length) === prefix + suffix) {
			// Remove the prefix and suffix
			o.cutStart = o.selStart - prefix.length;
			o.cutEnd = o.selEnd + suffix.length;
			o.replacement = "";
			o.newSelStart = o.cutStart;
			o.newSelEnd = o.newSelStart;
		} else {
			// Wrap the cursor instead
			o.cutStart = o.selStart;
			o.cutEnd = o.selEnd;
			o.replacement = prefix + suffix;
			o.newSelStart = o.selStart + prefix.length;
			o.newSelEnd = o.newSelStart;
		}
	}

	// options: lenPrefix, lenSuffix
	function removePrefixSuffix(options) {
		options = options || {};
		var _lenPrefix = options.lenPrefix || 0;
		var _lenSuffix = options.lenSuffix || 0;

		o.cutStart = o.selStart - _lenPrefix;
		o.cutEnd = o.selEnd + _lenSuffix;
		o.replacement = (_lenPrefix || _lenSuffix) ? o.selection : o.selection.substring(prefix.length, o.selection.length - suffix.length);
		o.newSelStart = o.cutStart;
		o.newSelEnd = o.cutStart + o.replacement.length;
	}

	function addPrefixSuffix() {
		// remove trailing space if requested
		switch(trailingSpaceAt(o.selection)) {
			case "no":
				// has no trailing spaces
				o.cutStart = o.selStart;
				o.cutEnd = o.selEnd;
				o.replacement = prefix + o.selection + suffix;
				o.newSelStart = o.selStart;
				o.newSelEnd = o.selStart + o.replacement.length;
				break;
			case "yes":
				// handle both ends
				o.cutStart = o.selEnd - (o.selection.trimStart().length);
				o.cutEnd = o.selection.trimEnd().length + o.selStart;
				o.replacement = prefix + o.selection.trim() + suffix;
				o.newSelStart = o.cutStart;
				o.newSelEnd = o.cutStart + o.replacement.length;
				break;
			case "start":
				// handle leading
				o.cutStart = o.selEnd - (o.selection.trimStart().length);
				o.cutEnd = o.selEnd;
				o.replacement = prefix + o.selection.trimStart() + suffix;
				o.newSelStart = o.cutStart;
				o.newSelEnd = o.cutStart + o.replacement.length;
				break;
			case "end":
				// handle trailing
				o.cutStart = o.selStart;
				o.cutEnd = o.selection.trimEnd().length + o.selStart;
				o.replacement = prefix + o.selection.trimEnd() + suffix;
				o.newSelStart = o.selStart;
				o.newSelEnd = o.selStart + o.replacement.length;
				break;
		}
	}

	if(o.selStart === o.selEnd) {
		// No selection; Create prefix and suffix. Set cursor in between them: ""|""
		togglePrefixSuffix();
	} else if(o.text.substring(o.selStart, o.selStart + prefix.length) === prefix &&
				o.text.substring(o.selEnd - suffix.length,o.selEnd) === suffix) {
		// Prefix and suffix are already present, so remove them
		removePrefixSuffix();
	} else if(o.text.substring(o.selStart - prefix.length, o.selStart) === prefix &&
				o.text.substring(o.selEnd, o.selEnd + suffix.length) === suffix) {
		// Prefix and suffix are present BUT not selected -> remove them
		removePrefixSuffix({"lenPrefix": prefix.length, "lenSuffix": suffix.length});
	} else {
		// Add the prefix and suffix
		addPrefixSuffix();
	}
};

})();
