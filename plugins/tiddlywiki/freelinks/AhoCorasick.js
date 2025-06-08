/*\
title: $:/plugins/tiddlywiki/freelinks/AhoCorasick.js
type: application/javascript
module-type: library

Aho-Corasick implementation for efficient string matching.
\*/

var AhoCorasick = function() {
    this.trie = { children: {}, fail: null, output: [] };
    this.failure = {};
};

AhoCorasick.prototype.buildFailureLinks = function() {
    var queue = [];
    var root = this.trie;
    this.failure[root] = root;
    for (var char in root.children) {
        if (root.children[char]) {
            this.failure[root.children[char]] = root;
            queue.push(root.children[char]);
        }
    }
    var maxIterations = 10000; // Adjusted for 13,000 tiddlers
    var iteration = 0;
    while (queue.length && iteration < maxIterations) {
        var node = queue.shift();
        for (var char in node.children) {
            if (node.children[char]) {
                var child = node.children[char];
                var fail = this.failure[node];
                var failCount = 0;
                var maxFailCount = 500; // Adjusted for safety
                while (fail && !fail.children[char] && failCount < maxFailCount) {
                    fail = this.failure[fail];
                    failCount++;
                }
                this.failure[child] = fail.children[char] || this.trie;
                if (this.failure[child].output.length) {
                    if (!child.output) child.output = [];
                    child.output.push.apply(child.output, this.failure[child].output);
                }
                queue.push(child);
            }
        }
        iteration++;
    }
    if (iteration >= maxIterations) {
        $tw.utils.warning("Aho-Corasick: buildFailureLinks exceeded max iterations");
    }
};

AhoCorasick.prototype.addPattern = function(pattern, index) {
    var node = this.trie;
    for (var i = 0; i < pattern.length; i++) {
        var char = pattern[i];
        if (!node.children[char]) {
            node.children[char] = { children: {}, output: [] };
        }
        node = node.children[char];
    }
    if (!node.output) node.output = [];
    node.output.push({ pattern: pattern, index: index });
};

AhoCorasick.prototype.search = function(text) {
    if (!$tw.utils.isString(text) || !text.length) {
        return [];
    }
    var matches = [];
    var node = this.trie;
    var maxIterations = text.length * 5; // Adjusted for efficiency
    var iteration = 0;
    for (var i = 0; i < text.length && iteration < maxIterations; i++) {
        var char = text[i];
        var transitionCount = 0;
        var maxTransitionCount = 200; // Adjusted for safety
        while (node && !node.children[char] && transitionCount < maxTransitionCount) {
            node = this.failure[node];
            transitionCount++;
        }
        node = node.children[char] || this.trie;
        if (node.output.length) {
            for (var j = 0; j < node.output.length; j++) {
                var match = node.output[j];
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
    if (iteration >= maxIterations) {
        $tw.utils.warning("Aho-Corasick: search exceeded max iterations");
    }
    return matches;
};

exports.AhoCorasick = AhoCorasick;
