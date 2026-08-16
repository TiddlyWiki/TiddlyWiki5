/*\
title: $:/core/modules/utils/aho-corasick.js
type: application/javascript
module-type: utils

Optimized Aho-Corasick string matching algorithm implementation with enhanced
performance and error handling for TiddlyWiki freelinking functionality.

- Uses WeakMap for failure links. WeakMap keys are compared by object identity
  (reference equality), which is required here because trie nodes are plain
  objects — a regular {} map would not work because JavaScript only supports
  string and Symbol keys, forcing object keys to be coerced to strings.
- Outputs are merged at build time (classic AC optimization), eliminating the
  need to walk the failure chain during search.
- Patterns and text are folded the same way, one character at a time, and the
  automaton is walked in folded space while reported indices stay in the
  text's own space. Turkish İ folds to two characters, so the two spaces are
  not the same length.
- No match count cap in search(); truncation is handled at the render stage
  by processTextWithMatches() to avoid silently dropping matches mid-text.
- Optional word boundary filtering: CJK always allowed; Latin requires
  non-word characters on both sides.

\*/

"use strict";

/*
Key under which a node keeps the patterns ending at it. Edges are added one character at a
time, so no edge key can be longer than one character and this cannot collide with one: a
pattern containing "$$" walks two separate "$" edges. The key was "$" until a pattern
containing that character overwrote the output list with a child node.
*/
var OUTPUTS = "$$";

/*
Lower case one character at a time, and use this for patterns as well as for text.

Whole string toLowerCase is context sensitive and can change length: Greek "ΑΣ" folds to
"ας" with a final sigma while its characters fold to "ασ", and Turkish "İ" folds to "i" plus
a combining dot. Folding the two sides differently put them in different spaces, so
"İstanbul" could never match itself.
*/
function foldCase(str) {
	var folded = "";
	for(var i = 0; i < str.length; i++) {
		folded += str[i].toLowerCase();
	}
	return folded;
}

function AhoCorasick() {
	this.trie = {};
	this.failure = new WeakMap();
	this.patternCount = 0;
}

AhoCorasick.prototype.addPattern = function(pattern, index) {
	if(!pattern || typeof pattern !== "string" || pattern.length === 0) {
		return;
	}
	var node = this.trie;
	for(var i = 0; i < pattern.length; i++) {
		var ch = pattern[i];
		if(!node[ch]) {
			node[ch] = {};
		}
		node = node[ch];
	}
	if(!node[OUTPUTS]) {
		node[OUTPUTS] = [];
	}
	node[OUTPUTS].push({
		pattern: pattern,
		index: index,
		length: pattern.length
	});
	this.patternCount++;
};

AhoCorasick.prototype.buildFailureLinks = function() {
	var queue = [];
	var root = this.trie;
	var self = this;

	this.failure = new WeakMap();
	this.failure.set(root, root);

	for(var ch in root) {
		if(ch === OUTPUTS) continue;
		if(root[ch] && typeof root[ch] === "object") {
			this.failure.set(root[ch], root);
			queue.push(root[ch]);
		}
	}

	var processedNodes = 0;
	var maxNodes = Math.max(100000, this.patternCount * 15);

	while(queue.length > 0) {
		if(processedNodes++ >= maxNodes) {
			var err = new Error("Aho-Corasick: buildFailureLinks exceeded maximum nodes (" + maxNodes + ")");
			// Tagged so a caller can recognise this one guard and still let real defects
			// propagate, rather than matching on the message
			err.code = "AHO_MAX_NODES";
			throw err;
		}
		var node = queue.shift();

		for(var edge in node) {
			if(edge === OUTPUTS) continue;
			var child = node[edge];
			if(!child || typeof child !== "object") continue;

			var fail = self.failure.get(node) || root;

			while(fail !== root && !fail[edge]) {
				fail = self.failure.get(fail) || root;
			}

			var nextFail = (fail[edge] && fail[edge] !== child) ? fail[edge] : root;
			self.failure.set(child, nextFail);

			if(nextFail[OUTPUTS]) {
				if(!child[OUTPUTS]) {
					child[OUTPUTS] = [];
				}
				child[OUTPUTS] = child[OUTPUTS].concat(nextFail[OUTPUTS]);
			}

			queue.push(child);
		}
	}
};

AhoCorasick.prototype.search = function(text, useWordBoundary, ignoreCase) {
	if(!text || typeof text !== "string" || text.length === 0) {
		return [];
	}

	var matches = [];
	var node = this.trie;
	var root = this.trie;
	var textLength = text.length;

	// Folding can turn one character into several, so the automaton is walked in folded
	// space while every reported index stays in the text's own space
	var origin = [];
	var foldedPos = 0;

	for(var i = 0; i < textLength; i++) {
		var folded = ignoreCase ? text[i].toLowerCase() : text[i];

		for(var f = 0; f < folded.length; f++) {
			var ch = folded[f];
			origin[foldedPos] = i;

			while(node !== root && !node[ch]) {
				node = this.failure.get(node) || root;
			}
			if(node[ch]) {
				node = node[ch];
			}

			if(node[OUTPUTS]) {
				var outputs = node[OUTPUTS];
				for(var j = 0; j < outputs.length; j++) {
					var out = outputs[j];
					var foldedStart = foldedPos - out.length + 1;
					if(foldedStart < 0) continue;

					var matchStart = origin[foldedStart];
					var matchEnd = i + 1;

					if(useWordBoundary && !this.isWordBoundaryMatch(text, matchStart, matchEnd)) {
						continue;
					}

					matches.push({
						pattern: out.pattern,
						index: matchStart,
						length: matchEnd - matchStart,
						titleIndex: out.index
					});
				}
			}

			foldedPos++;
		}
	}

	return matches;
};

AhoCorasick.prototype.isWordBoundaryMatch = function(text, start, end) {
	var matchedText = text.substring(start, end);

	if(/[\u3400-\u9FFF\uF900-\uFAFF]/.test(matchedText)) {
		return true;
	}

	var beforeChar = start > 0 ? text[start - 1] : "";
	var afterChar = end < text.length ? text[end] : "";

	var isLatinWordChar = function(char) {
		return /[a-zA-Z0-9_\u00C0-\u00FF]/.test(char);
	};

	return !isLatinWordChar(beforeChar) && !isLatinWordChar(afterChar);
};

AhoCorasick.prototype.clear = function() {
	this.trie = {};
	this.failure = new WeakMap();
	this.patternCount = 0;
};

AhoCorasick.prototype.getStats = function() {
	var nodeCount = 0;
	function countNodes(node) {
		if(!node) return;
		nodeCount++;
		for(var key in node) {
			if(key === OUTPUTS) continue;
			if(node[key] && typeof node[key] === "object") {
				countNodes(node[key]);
			}
		}
	}
	countNodes(this.trie);

	return {
		nodeCount: nodeCount,
		patternCount: this.patternCount,
		failureLinks: this.patternCount
	};
};

exports.AhoCorasick = AhoCorasick;
exports.foldCase = foldCase;
