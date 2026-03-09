/*\

title: $:/core/modules/utils/aho-corasick.js
type: application/javascript
module-type: utils

Optimized Aho-Corasick string matching algorithm implementation with enhanced performance
and error handling for TiddlyWiki freelinking functionality.

- Uses WeakMap for failure links (required; plain object keys would collide).
- search() converts case per character to avoid Unicode index desync.
- Optional word boundary filtering: CJK always allowed; Latin requires non-word chars around.

\*/

"use strict";

function AhoCorasick() {
	this.trie = {};
	this.failure = new WeakMap();
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
	var self = this;

	this.failure = new WeakMap();
	this.failure.set(root, root);

	for(var ch in root) {
		if(ch === "$") continue;
		if(root[ch] && typeof root[ch] === "object") {
			this.failure.set(root[ch], root);
			queue.push(root[ch]);
		}
	}

	var processedNodes = 0;
	var maxNodes = Math.max(100000, this.patternCount * 15);

	while(queue.length > 0) {
		if(processedNodes++ >= maxNodes) {
			throw new Error("Aho-Corasick: buildFailureLinks exceeded maximum nodes (" + maxNodes + ")");
		}
		var node = queue.shift();

		for(var edge in node) {
			if(edge === "$") continue;
			var child = node[edge];
			if(!child || typeof child !== "object") continue;

			var fail = self.failure.get(node) || root;
			var depth = 0;

			while(fail !== root && !fail[edge] && depth < self.maxFailureDepth) {
				fail = self.failure.get(fail) || root;
				depth++;
			}

			var nextFail = (fail[edge] && fail[edge] !== child) ? fail[edge] : root;
			self.failure.set(child, nextFail);

			if(nextFail.$) {
				if(!child.$) child.$ = [];
				child.$ = child.$.concat(nextFail.$);
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

	var maxMatches = Math.min(textLength * 2, 10000);

	for(var i = 0; i < textLength; i++) {
		var ch = ignoreCase ? text[i].toLowerCase() : text[i];

		while(node !== root && !node[ch]) {
			node = this.failure.get(node) || root;
		}
		if(node[ch]) {
			node = node[ch];
		}

		if(node.$) {
			var outputs = node.$;
			for(var j = 0; j < outputs.length && matches.length < maxMatches; j++) {
				var out = outputs[j];
				var matchStart = i - out.length + 1;
				var matchEnd = i + 1;
				if(matchStart < 0) continue;

				if(useWordBoundary && !this.isWordBoundaryMatch(text, matchStart, matchEnd)) {
					continue;
				}

				matches.push({
					pattern: out.pattern,
					index: matchStart,
					length: out.length,
					titleIndex: out.index
				});
			}
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
			if(key === "$") continue;
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
