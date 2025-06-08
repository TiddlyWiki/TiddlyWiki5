/*\
title: $:/plugins/tiddlywiki/freelinks/AhoCorasick.js
type: application/javascript
module-type: library

Aho-Corasick implementation for efficient string matching.
\*/

exports.AhoCorasick = function() {
    this.root = { children: {}, fail: null, output: [] };
    
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
	var maxIterations = 100000; // Prevent infinite loops
	var iteration = 0;
	while(queue.length && iteration < maxIterations) {
		var node = queue.shift();
		for(var char in node) {
			if(node[char] && char !== '$') {
				var child = node[char];
				var fail = this.failure[node];
				var failCount = 0;
				var maxFailCount = 1000; // Prevent deep failure chains
				while(fail && !fail[char] && failCount < maxFailCount) {
					fail = this.failure[fail];
					failCount++;
				}
				this.failure[child] = fail[char] || this.trie;
				if(this.failure[child].$) {
					if(!child.$) {
						child.$ = [];
					}
					child.$.push.apply(child.$, this.failure[child].$);
				}
				queue.push(child);
			}
		}
		iteration++;
	}
	if(iteration >= maxIterations) {
		console.error("Aho-Corasick: buildFailureLinks exceeded max iterations");
	}
};

AhoCorasick.prototype.search = function(text) {
	if(!text || typeof text !== "string") {
		return [];
	}
	var matches = [];
	var node = this.trie;
	var maxIterations = text.length * 10; // Prevent infinite loops
	var iteration = 0;
	for(var i = 0; i < text.length && iteration < maxIterations; i++) {
		var char = text[i];
		var transitionCount = 0;
		var maxTransitionCount = 1000; // Prevent deep transitions
		while(node && !node[char] && transitionCount < maxTransitionCount) {
			node = this.failure[node];
			transitionCount++;
		}
		node = node[char] || this.trie;
		if(node.$) {
			for(var j = 0; j < node.$.length; j++) {
				var match = node.$[j];
				matches.push({
					pattern: match.pattern,
					index: i - match.pattern.length + 1,
					length: match.pattern.length,
					titleIndex: match.index
				});
			}
		}
		iteration++;
	}
	if(iteration >= maxIterations) {
		console.error("Aho-Corasick: search exceeded max iterations");
	}
	return matches;
};
};
