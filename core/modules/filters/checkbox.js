/*\
title: $:/core/modules/filters/checkbox.js
type: application/javascript
module-type: filteroperator

For the default (no suffix) form, the CheckboxIndexer is used when available
for O(1)-per-tiddler lookups. The :text form always scans the raw text.

\*/

"use strict";

const STATE_PATTERN_SOURCES = {
	checked: "\\[[xX]\\]",
	unchecked: "\\[ \\]"
};

// No `g` flag — no lastIndex state between calls.
const STATE_TEST_REGEXPS = {
	checked: new RegExp(STATE_PATTERN_SOURCES.checked),
	unchecked: new RegExp(STATE_PATTERN_SOURCES.unchecked)
};

const getState = (operand) => {
	if(operand === "checked" || operand === "unchecked") {
		return operand;
	}
	return undefined;
};

const matchesCheckbox = (text, state) => {
	if(state) {
		return STATE_TEST_REGEXPS[state].test(text);
	}
	return STATE_TEST_REGEXPS.checked.test(text) || STATE_TEST_REGEXPS.unchecked.test(text);
};

const makeExtractRegExp = (state) => {
	const markerSource = state
		? STATE_PATTERN_SOURCES[state]
		: "(?:" + STATE_PATTERN_SOURCES.checked + "|" + STATE_PATTERN_SOURCES.unchecked + ")";
	return new RegExp(markerSource + "\\s*([^\\n]+)","g");
};

exports.checkbox = function(source,operator,options) {
	const results  = [];
	const suffix   = operator.suffix || "";
	const invert   = operator.prefix === "!";
	const state = getState(operator.operand);

	if(suffix === "text") {
		source((tiddler) => {
			if(!tiddler) return;
			const text = tiddler.fields.text || "";
			const re = makeExtractRegExp(state);
			let m;
			while((m = re.exec(text)) !== null) {
				const item = m[1].trim();
				if(item) results.push(item);
			}
		});
		return results;
	}

	const indexer = options.wiki.getIndexer("CheckboxIndexer");
	if(indexer) {
		const indexedSet = Object.create(null);
		for(const title of indexer.lookup(state)) {
			indexedSet[title] = true;
		}
		source((tiddler,title) => {
			if(!tiddler) return;
			if(!!indexedSet[title] !== invert) results.push(title);
		});
	} else {
		// Keep the regex fallback so checkbox[] still works when indexers are disabled.
		source((tiddler,title) => {
			if(!tiddler) return;
			if(matchesCheckbox(tiddler.fields.text || "",state) !== invert) results.push(title);
		});
	}
	return results;
};
