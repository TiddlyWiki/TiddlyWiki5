/*\
title: $:/core/modules/filters/checkbox.js
type: application/javascript
module-type: filteroperator

Filter operator for finding tiddlers containing wikitext checkboxes.

Usage:
  [checkbox[]]          - tiddlers containing any checkbox ([ ], [x], or [X])
  [checkbox[checked]]   - tiddlers with at least one checked checkbox ([x] or [X])
  [checkbox[unchecked]] - tiddlers with at least one unchecked checkbox ([ ])
  [!checkbox[...]]      - negated forms of the above

The operator scans the tiddler's text field for the checkbox syntax.
This is a fast regex scan; it does not do a full wikitext parse and therefore
will also match checkboxes inside code blocks or comments.

\*/

"use strict";

// Regexps match the same syntax as the checkbox wikirule parser rule.
// No `g` flag so there is no lastIndex state to manage between calls.
var REGEXP_ANY      = /\[([ xX])\]/;
var REGEXP_CHECKED  = /\[[xX]\]/;
var REGEXP_UNCHECKED = /\[ \]/;

exports.checkbox = function(source, operator, options) {
	var results = [];
	var operand = operator.operand; // "", "checked", or "unchecked"
	var invert = operator.prefix === "!";
	var regexp;
	if(operand === "checked") {
		regexp = REGEXP_CHECKED;
	} else if(operand === "unchecked") {
		regexp = REGEXP_UNCHECKED;
	} else {
		regexp = REGEXP_ANY;
	}
	source(function(tiddler, title) {
		if(!tiddler) {
			return;
		}
		var found = regexp.test(tiddler.fields.text || "");
		if(found !== invert) {
			results.push(title);
		}
	});
	return results;
};
