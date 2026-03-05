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

When the CheckboxIndexer is available, indexed titles are intersected with
the input set for O(1)-per-title lookups.  Falls back to a regex scan when
the indexer is not loaded.

\*/

"use strict";

// Regexps match the same syntax as the checkbox wikirule parser rule.
// No `g` flag so there is no lastIndex state to manage between calls.
var REGEXP_ANY       = /\[([ xX])\]/;
var REGEXP_CHECKED   = /\[[xX]\]/;
var REGEXP_UNCHECKED = /\[ \]/;

exports.checkbox = function(source, operator, options) {
	var results = [];
	var operand = operator.operand; // "", "checked", or "unchecked"
	var invert = operator.prefix === "!";
	var category;
	if(operand === "checked") {
		category = "checked";
	} else if(operand === "unchecked") {
		category = "unchecked";
	} else {
		category = "any";
	}
	// Try the indexer first
	var indexer = options.wiki.getIndexer("CheckboxIndexer");
	if(indexer) {
		var indexedSet = Object.create(null);
		var indexedTitles = indexer.lookup(category);
		for(var i = 0; i < indexedTitles.length; i++) {
			indexedSet[indexedTitles[i]] = true;
		}
		source(function(tiddler, title) {
			if(!tiddler) {
				return;
			}
			var found = !!indexedSet[title];
			if(found !== invert) {
				results.push(title);
			}
		});
	} else {
		// Fall back to regex scan when indexer is not available
		var regexp;
		if(category === "checked") {
			regexp = REGEXP_CHECKED;
		} else if(category === "unchecked") {
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
	}
	return results;
};
