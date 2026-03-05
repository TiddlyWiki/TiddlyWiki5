/*\
title: $:/core/modules/filters/checkbox.js
type: application/javascript
module-type: filteroperator

Filter operator for finding tiddlers containing wikitext checkboxes and for
extracting checkbox item text.

Title-returning forms (default, no suffix):
  [checkbox[]]          - tiddlers containing any checkbox ([ ], [x], or [X])
  [checkbox[checked]]   - tiddlers with at least one checked checkbox
  [checkbox[unchecked]] - tiddlers with at least one unchecked checkbox
  [!checkbox[...]]      - negated forms of the above

Text-extracting form (suffix :text):
  [checkbox:text[]]          - text of every checkbox item across all input tiddlers
  [checkbox:text[checked]]   - text of every checked checkbox item
  [checkbox:text[unchecked]] - text of every unchecked checkbox item

The operand controls which checkboxes are matched:
  (empty)     any checkbox state
  "checked"   [x] or [X] only
  "unchecked" [ ] only

For the default (no suffix) form, the CheckboxIndexer is used when available
for O(1)-per-tiddler lookups. The :text form always scans the raw text.

Note: Both forms scan the raw wikitext and will also match checkboxes inside
code blocks or comments.

\*/

"use strict";

// Regexps used for the title-returning (indexed/fallback) path.
// No `g` flag — no lastIndex state between calls.
var REGEXP_ANY       = /\[([ xX])\]/;
var REGEXP_CHECKED   = /\[[xX]\]/;
var REGEXP_UNCHECKED = /\[ \]/;

// Returns a fresh global RegExp for extracting checkbox text items.
// Must be fresh (or lastIndex reset) before each scan.
function makeExtractRegExp(category) {
	if(category === "checked") {
		return /\[[xX]\]\s*([^\n]+)/g;
	} else if(category === "unchecked") {
		return /\[ \]\s*([^\n]+)/g;
	} else {
		return /\[[ xX]\]\s*([^\n]+)/g;
	}
}

exports.checkbox = function(source, operator, options) {
	var results = [];
	var operand = operator.operand; // "", "checked", or "unchecked"
	var suffix  = operator.suffix  || "";  // "", "text"
	var invert  = operator.prefix  === "!";
	var category;
	if(operand === "checked") {
		category = "checked";
	} else if(operand === "unchecked") {
		category = "unchecked";
	} else {
		category = "any";
	}

	// ── :text suffix ─────────────────────────────────────────────────────────
	// Returns one result per checkbox item (the text after the [ ] / [x] marker
	// on the same line), not per tiddler.  Cannot use the indexer.
	if(suffix === "text") {
		source(function(tiddler, title) {
			if(!tiddler) {
				return;
			}
			var text = tiddler.fields.text || "";
			var re = makeExtractRegExp(category);
			var m;
			while((m = re.exec(text)) !== null) {
				var item = m[1].trim();
				if(item) {
					results.push(item);
				}
			}
		});
		return results;
	}

	// ── Default: return tiddler titles ────────────────────────────────────────
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
		// Regex fallback when indexer is not available
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
