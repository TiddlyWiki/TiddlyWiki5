/*\
title: $:/core/modules/filters/checkbox.js
type: application/javascript
module-type: filteroperator

For the default (no suffix) form, the CheckboxIndexer is used when available
for O(1)-per-tiddler lookups. The :text form always scans the raw text.

\*/

"use strict";

// Regexps used for the title-returning (indexed/fallback) path.
// No `g` flag — no lastIndex state between calls.
const REGEXP_ANY       = /\[([ xX])\]/;
const REGEXP_CHECKED   = /\[[xX]\]/;
const REGEXP_UNCHECKED = /\[ \]/;

// Returns a fresh global RegExp for extracting checkbox text items.
const makeExtractRegExp = (category) => {
if(category === "checked")   return /\[[xX]\]\s*([^\n]+)/g;
if(category === "unchecked") return /\[ \]\s*([^\n]+)/g;
return /\[[ xX]\]\s*([^\n]+)/g;
};

exports.checkbox = function(source,operator,options) {
const results  = [];
const operand  = operator.operand;
const suffix   = operator.suffix || "";
const invert   = operator.prefix === "!";
const category = operand === "checked"   ? "checked"
               : operand === "unchecked" ? "unchecked"
               : "any";

// — :text suffix ——————————————————————————————————————————————————————————
// Returns one result per checkbox item (the text after the marker on the
// same line), not per tiddler.  Cannot use the indexer.
if(suffix === "text") {
source((tiddler) => {
if(!tiddler) return;
const text = tiddler.fields.text || "";
const re = makeExtractRegExp(category);
let m;
while((m = re.exec(text)) !== null) {
const item = m[1].trim();
if(item) results.push(item);
}
});
return results;
}

// — Default: return tiddler titles ————————————————————————————————————————
const indexer = options.wiki.getIndexer("CheckboxIndexer");
if(indexer) {
const indexedSet = Object.create(null);
for(const title of indexer.lookup(category)) {
indexedSet[title] = true;
}
source((tiddler,title) => {
if(!tiddler) return;
if(!!indexedSet[title] !== invert) results.push(title);
});
} else {
// Regex fallback when indexer is not available
const regexp = category === "checked"   ? REGEXP_CHECKED
             : category === "unchecked" ? REGEXP_UNCHECKED
             : REGEXP_ANY;
source((tiddler,title) => {
if(!tiddler) return;
if(regexp.test(tiddler.fields.text || "") !== invert) results.push(title);
});
}
return results;
};
