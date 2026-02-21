/*\
title: $:/core/modules/utils/aho-corasick.js
type: application/javascript
module-type: utils

Optimized Aho-Corasick string matching algorithm implementation with enhanced performance
and error handling for TiddlyWiki freelinking functionality.

Usage:

Initialization:
 Create an AhoCorasick instance: var ac = new AhoCorasick();
 After initialization, the trie and failure structures are automatically created to store patterns and failure links.

Adding Patterns:
 Call addPattern(pattern, index) to add a pattern, e.g., ac.addPattern("hello", 0);
 pattern is the string to match, and index is an identifier for tracking results.
 Multiple patterns can be added, stored in the trie structure.

Building Failure Links:
 Call buildFailureLinks() to construct failure links for efficient multi-pattern matching.
 Includes a maximum node limit (default 100,000 or 15 times the pattern count) to prevent excessive computation.

Performing Search:
 Use search(text, useWordBoundary) to find pattern matches in the text.
 text is the input string, and useWordBoundary (boolean) controls whether to enforce word boundary checks.
 Returns an array of match results, each containing pattern (matched pattern), index (start position),
 length (pattern length), and titleIndex (pattern identifier).

Word Boundary Check:
 If useWordBoundary is true, only matches surrounded by non-Latin-word characters are returned.
 CJK characters have no word boundary concept and are always treated as valid matches regardless of context.

Cleanup and Statistics:
 Use clear() to reset the trie and failure links, freeing memory.
 Use getStats() to retrieve statistics, including node count (nodeCount), pattern count (patternCount),
 and failure link count (failureLinks).

\*/

"use strict";

function AhoCorasick() {
	this.trie = {};
	this.failure = {};
	this.maxFailureDepth = 100;
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

	if(!node.$) {
		node.$ = [];
	}
	node.$.push({
		pattern: pattern,
		index: index,
		length: pattern.length
	});

	this.patternCount++;
};

AhoCorasick.prototype.buildFailureLinks = function() {
	var queue = [];
	var root = this.trie;
	this.failure[root] = root;

	for(var ch in root) {
		if(root[ch] && typeof root[ch] === "object" && ch !== "$") {
			this.failure[root[ch]] = root;
			queue.push(root[ch]);
		}
	}

	var processedNodes = 0;
	var maxNodes = Math.max(100000, this.patternCount * 15);

	while(queue.length > 0 && processedNodes < maxNodes) {
		var node = queue.shift();
		processedNodes++;

		for(var ch in node) {
			if(!node[ch] || typeof node[ch] !== "object" || ch === "$") {
				continue;
			}

			var child = node[ch];
			var fail = this.failure[node];
			var failureDepth = 0;

			while(fail !== root && !fail[ch] && failureDepth < this.maxFailureDepth) {
				fail = this.failure[fail];
				failureDepth++;
			}

			this.failure[child] = (fail[ch] && fail[ch] !== child) ? fail[ch] : root;

			queue.push(child);
		}
	}

	if(processedNodes >= maxNodes) {
		throw new Error("Aho-Corasick: buildFailureLinks exceeded maximum nodes (" + maxNodes + ")");
	}
};

AhoCorasick.prototype.search = function(text, useWordBoundary) {
	if(!text || typeof text !== "string" || text.length === 0) {
		return [];
	}

	var matches = [];
	var node = this.trie;
	var root = this.trie;
	var textLength = text.length;
	var maxMatches = Math.min(textLength * 2, 10000);

	for(var i = 0; i < textLength; i++) {
		var ch = text[i];

		while(node !== root && !node[ch]) {
			node = this.failure[node];
		}
		if(node[ch]) {
			node = node[ch];
		}

		var cur = node;
		while(cur) {
			if(cur.$) {
				var outputs = cur.$;
				for(var j = 0; j < outputs.length && matches.length < maxMatches; j++) {
					var output = outputs[j];
					var matchStart = i - output.length + 1;
					var matchEnd = i + 1;

					if(matchStart < 0) {
						continue;
					}

					if(useWordBoundary && !this.isWordBoundaryMatch(text, matchStart, matchEnd)) {
						continue;
					}

					matches.push({
						pattern: output.pattern,
						index: matchStart,
						length: output.length,
						titleIndex: output.index
					});
				}
			}

			if(cur === root) {
				break;
			}
			cur = this.failure[cur];
		}
	}

	return matches;
};

AhoCorasick.prototype.isWordBoundaryMatch = function(text, start, end) {
	var beforeChar = start > 0 ? text[start - 1] : "";
	var afterChar = end < text.length ? text[end] : "";

	var matchedText = text.substring(start, end);
	if(/[\u3400-\u9FFF\uF900-\uFAFF]/.test(matchedText)) {
		return true;
	}

	var isLatinWordChar = function(char) {
		return /[a-zA-Z0-9_\u00C0-\u00FF]/.test(char);
	};

	return !isLatinWordChar(beforeChar) && !isLatinWordChar(afterChar);
};

AhoCorasick.prototype.clear = function() {
	this.trie = {};
	this.failure = {};
	this.patternCount = 0;
};

AhoCorasick.prototype.getStats = function() {
	var nodeCount = 0;
	var failureCount = 0;

	function countNodes(node) {
		if(!node) {
			return;
		}
		nodeCount++;
		for(var key in node) {
			if(node[key] && typeof node[key] === "object" && key !== "$") {
				countNodes(node[key]);
			}
		}
	}

	countNodes(this.trie);
	failureCount = Object.keys(this.failure).length;

	return {
		nodeCount: nodeCount,
		patternCount: this.patternCount,
		failureLinks: failureCount
	};
};

exports.AhoCorasick = AhoCorasick;
