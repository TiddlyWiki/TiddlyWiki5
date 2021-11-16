#!/usr/bin/env node

/*
Reads JSON tiddlers from stdin and outputs stats to stdout

	stats.js

This utility is provided as an example of an external task that understands tiddler objects encoded in JSON.

It expects to read an array of tiddler objects from stdin in this format:

	[
		{
			"title": "Tiddler Title",
			"text": "Text of tiddler",
			"tags": "MyTag [[My Other Tag]]"
		},
		...
	]

The output is in the same format.

*/

process.stdin.resume();
process.stdin.setEncoding("utf8");
var inputChunks = [];
process.stdin.on("data",function(chunk) {
	inputChunks.push(chunk);
});
process.stdin.on("end",function() {
	// Read the JSON input
	var json = inputChunks.join(""),
		data;
	try {
		data = JSON.parse(json);
	} catch(e) {
		throw "Malformed JSON: " + e + "\n\n" + json;
	}
	// Compute some stats
	var output = computeStats(data);
	// Output the result
	process.stdout.write(JSON.stringify(output));
});

function computeStats(tiddlers) {
	var numTiddlers = tiddlers.length,
		wordCount = 0,
		wordFrequency = {};
	tiddlers.forEach(function(tiddler) {
	    var matches = (tiddler.text || "").match(/[A-Za-z0-9\u00c0-\u00d6\u00d8-\u00de\u00df-\u00f6\u00f8-\u00ff\u0150\u0170\u0151\u0171]+/g);
	    if(matches) {
	    	wordCount += matches.length;
	    	matches.forEach(function(word) {
	    		word = word.toLowerCase();
	    		wordFrequency[word] = wordFrequency[word] || 0;
	    		wordFrequency[word] += 1;
	    	});
	    }
	});
	var sortedWords = Object.keys(wordFrequency).sort(function(a,b) {
		if(wordFrequency[a] > wordFrequency[b]) {
			return -1;
		} else if(wordFrequency[a] < wordFrequency[b]) {
			return +1;
		} else {
			return 0;
		}
	});
	// Output
	return [
		{
			title: "PipeOutput",
			text: numTiddlers + " tiddlers in sample.\n" + wordCount + " words in sample.\n" + sortedWords.filter(function(word) {
				return word.length > 1 && wordFrequency[word] > 1;
			}).map(function(word) {
				return word + " " + wordFrequency[word] + "\n";
			}).join(""),
			type: "text/plain"
		}
	];
};
