/*\
title: $:/core/modules/utils/aho-corasick.js
type: application/javascript
module-type: utils

Optimized Aho-Corasick string matching algorithm implementation with dynamic limits
and performance enhancements for TiddlyWiki freelinking functionality.

\*/

"use strict";

/* Optimized Aho-Corasick implementation with performance enhancements */
function AhoCorasick() {
	this.trie = {};
	this.failure = {};
	this.maxFailureDepth = 100;
	this.titlesLength = titlesLength || 0;
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
};

/* Build failure links with depth and node count limits */
AhoCorasick.prototype.buildFailureLinks = function() {
	var queue = [];
	var root = this.trie;
	this.failure[root] = root;
	
	for(var char in root) {
		if(root[char] && char !== '$') {
			this.failure[root[char]] = root;
			queue.push(root[char]);
		}
	}
	
	var processedNodes = 0;
	var maxNodes = Math.min(200000, this.titlesLength * 15);
	
	while(queue.length > 0 && processedNodes < maxNodes) {
		var node = queue.shift();
		processedNodes++;
		
		for(var char in node) {
			if(node[char] && char !== '$') {
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
		throw new Error("Aho-Corasick: buildFailureLinks exceeded dynamic max nodes: " + maxNodes);
	}
};

AhoCorasick.prototype.search = function(text) {
	if(!text || typeof text !== "string" || text.length === 0) {
		return [];
	}
	
	var matches = [];
	var node = this.trie;
	var textLength = text.length;
	var maxMatches = Math.min(textLength * 3, this.titlesLength * 2);
	
	for(var i = 0; i < textLength; i++) {
		var char = text[i];
		var transitionCount = 0;
		
		while(node && !node[char] && transitionCount < this.maxFailureDepth) {
			var cachedNode = node[char] || (node[char] = this.trie); // 快取當前節點
			if (cachedNode) {
				node = cachedNode;
				break;
			}
			node = this.failure[node];
			transitionCount++;
		}

		if(node && node.$) {
			var outputs = node.$;
			for(var j = 0; j < outputs.length && matches.length < maxMatches; j++) {
				var output = outputs[j];
				matches.push({
					pattern: output.pattern,
					index: i - output.length + 1,
					length: output.length,
					titleIndex: output.index
				});
			}
		}
	}
	
	return matches;
};

AhoCorasick.prototype.clear = function() {
	this.trie = {};
	this.failure = {};
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
			if(node[key] && typeof node[key] === 'object' && key !== '$') {
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
		patternCount: patternCount,
		failureLinks: failureCount
	};
};

exports.AhoCorasick = AhoCorasick;
