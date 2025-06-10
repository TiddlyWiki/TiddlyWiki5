/*\
title: $:/core/modules/utils/aho-corasick.js
type: application/javascript
module-type: utils

Aho-Corasick string matching algorithm implementation with enhanced error handling
for TiddlyWiki freelinking functionality.

\*/

"use strict";

/**
 * Aho-Corasick implementation with enhanced error handling
 * @constructor
 */
function AhoCorasick() {
	this.trie = {};
	this.failure = {};
	this.output = {};
}

/**
 * Add a pattern to the Aho-Corasick automaton
 * @param {string} pattern - The pattern to add
 * @param {number} index - The index of the pattern for identification
 */
AhoCorasick.prototype.addPattern = function(pattern, index) {
	if(!pattern || typeof pattern !== "string") {
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
	node.$.push({ pattern: pattern, index: index });
};

/**
 * Build failure links for the Aho-Corasick automaton
 */
AhoCorasick.prototype.buildFailureLinks = function() {
	var queue = [];
	var root = this.trie;
	this.failure[root] = root;
	
	// Initialize first level failure links
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
				
				// Copy output from failure link
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
		throw new Error("Aho-Corasick: buildFailureLinks exceeded max iterations");
	}
};

/**
 * Search for all patterns in the given text
 * @param {string} text - The text to search in
 * @returns {Array} Array of match objects with pattern, index, length, and titleIndex properties
 */
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
		throw new Error("Aho-Corasick: search exceeded max iterations");
	}
	
	return matches;
};

// Export the AhoCorasick constructor
exports.AhoCorasick = AhoCorasick;
