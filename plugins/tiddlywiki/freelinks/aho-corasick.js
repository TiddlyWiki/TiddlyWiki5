/*\
title: $:/core/modules/utils/aho-corasick.js
type: application/javascript
module-type: utils

Optimized Aho-Corasick string matching algorithm implementation with enhanced performance
and error handling for TiddlyWiki freelinking functionality.

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
		var char = pattern[i];
		if(!node[char]) {
			node[char] = {};
		}
		node = node[char];
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
	
	for(var char in root) {
		if(root[char] && char !== "$") {
			this.failure[root[char]] = root;
			queue.push(root[char]);
		}
	}
	
	var processedNodes = 0;
	var maxNodes = Math.max(100000, this.patternCount * 15);
	
	while(queue.length > 0 && processedNodes < maxNodes) {
		var node = queue.shift();
		processedNodes++;
		
		for(var char in node) {
			if(node[char] && char !== "$") {
				var child = node[char];
				var fail = this.failure[node];
				var failureDepth = 0;
				
				while(fail && !fail[char] && failureDepth < this.maxFailureDepth) {
					fail = this.failure[fail];
					failureDepth++;
				}
				
				var failureLink = (fail && fail[char]) ? fail[char] : root;
				this.failure[child] = failureLink;
				
				var failureOutput = this.failure[child];
				if(failureOutput && failureOutput.$) {
					if(!child.$) {
						child.$ = [];
					}
					child.$.push.apply(child.$, failureOutput.$);
				}
				
				queue.push(child);
			}
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
	var textLength = text.length;
	var maxMatches = Math.min(textLength * 2, 10000);
	
	for(var i = 0; i < textLength; i++) {
		var char = text[i];
		var transitionCount = 0;
		
		while(node && !node[char] && node !== this.trie && transitionCount < this.maxFailureDepth) {
			node = this.failure[node] || this.trie;
			transitionCount++;
		}
		
		if(node && node[char]) {
			node = node[char];
		} else {
			node = this.trie;
			if(this.trie[char]) {
				node = this.trie[char];
			}
		}
		
		var currentNode = node;
		var collectCount = 0;
		while(currentNode && collectCount < 10) {
			if(currentNode.$) {
				var outputs = currentNode.$;
				for(var j = 0; j < outputs.length && matches.length < maxMatches; j++) {
					var output = outputs[j];
					var matchStart = i - output.length + 1;
					var matchEnd = i + 1;
					
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
			currentNode = this.failure[currentNode];
			if(currentNode === this.trie) break;
			collectCount++;
		}
	}
	
	return matches;
};

AhoCorasick.prototype.isWordBoundaryMatch = function(text, start, end) {
	var beforeChar = start > 0 ? text[start - 1] : '';
	var afterChar = end < text.length ? text[end] : '';
	
	var isWordChar = function(char) {
		return /[a-zA-Z0-9_]/.test(char);
	};
	
	var beforeIsWord = beforeChar && isWordChar(beforeChar);
	var afterIsWord = afterChar && isWordChar(afterChar);
	
	return !beforeIsWord && !afterIsWord;
};

AhoCorasick.prototype.clear = function() {
	this.trie = {};
	this.failure = {};
	this.patternCount = 0;
};

AhoCorasick.prototype.getStats = function() {
	var nodeCount = 0;
	var patternCount = 0;
	var failureCount = 0;
	
	function countNodes(node) {
		if(!node) return;
		nodeCount++;
		if(node.$) {
			patternCount += node.$.length;
		}
		for(var key in node) {
			if(node[key] && typeof node[key] === "object" && key !== "$") {
				countNodes(node[key]);
			}
		}
	}
	
	countNodes(this.trie);
	
	for(var key in this.failure) {
		failureCount++;
	}
	
	return {
		nodeCount: nodeCount,
		patternCount: this.patternCount,
		failureLinks: failureCount
	};
};

exports.AhoCorasick = AhoCorasick;
