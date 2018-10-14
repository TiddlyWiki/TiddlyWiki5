#!/usr/bin/env node

/*
Reads source text from stdin and mimics it to stdout to stdout using a simple statistical analysis of ngram frequency

	mimic.js <ngram-length> <output-length>

This utility is provided as an example of using an external task that doesn't have any prior knowledge of
TiddlyWiki. Like many Unix utilities, it just reads input from stdin and writes its output to stdout.

*/

var paramNgramLength = parseInt(process.argv[2] || "",10) || 3, // Size of ngrams for mimicing
	paramOutputLength = parseInt(process.argv[3] || "",10) || 1000;

process.stdin.resume();
process.stdin.setEncoding("utf8");
var inputChunks = [];
process.stdin.on("data",function(chunk) {
	inputChunks.push(chunk);
});
process.stdin.on("end",function() {
	// Do the mimicry
	var output = mimic(inputChunks.join(""),paramNgramLength);
	// Output the result
	process.stdout.write(output);
});

function mimic(sourceText,paramNgramLength) {
	if(!sourceText) {
		return "";
	}
	var tree = {};
	scanText(tree,sourceText,paramNgramLength);
	return generateText(tree,sourceText,paramNgramLength,paramOutputLength);
}

/*
The source text is scanned to build a tree of the ngram prefixes as follows:

{
	"abc": { // The ngram prefix described by this record
		count: 42, // The number of times the prefix is found in the source text
		next: [ // An array of information about each subsequent character encountered after the prefix
			{char: "d", count: 41},
			{char: " ", count: 1}
		]
	},
	"def": ... etc
}

*/

// Process the source text into the specified tree with the chosen ngram size
function scanText(tree,sourceText,size) {
	var currgram = [],ptr,c,ngram,branch,n;
	if(sourceText.length <= size*2)
		return tree;
	sourceText += sourceText.substring(0,size*2-1); // Wrap the text around
	for(ptr=0; ptr<size; ptr++) {
		currgram.push(sourceText.substr(ptr,1));
	}
	while(ptr < sourceText.length) {
		ngram = currgram.join("");
		c = sourceText.substr(ptr++,1);
		branch = tree[ngram];
		if(branch === undefined) {
			branch = tree[ngram] = {count: 0,next: []};
		}
		for(n = 0; n<branch.next.length; n++) {
			if(branch.next[n].char === c)
				break;
		}
		if(branch.next[n] === undefined) {
			branch.next[n] = {char: c, count: 1};
		} else {
			branch.next[n].count++;
		}
		branch.count++;
		currgram.push(c)
		currgram.shift();
	}
	return tree;
}

// Use the tree to generate mimicry
function generateText(tree,sourceText,size,length) {
	var currgram = [];
	for(var t=0; t<size; t++) {
		currgram.push(sourceText.substr(t,1));
	}
	var result = [];
	var c,ngram,branch,r,n;
	for(t=0; t<length; t++) {
		ngram = currgram.join("");
		branch = tree[ngram];
		n = 0;
		r = Math.floor(Math.random() * branch.count);
		while(r >= branch.next[n].count) {
			r = r - branch.next[n].count;
			n++;
		}
		c = branch.next[n].char;
		result.push(c);
		currgram.push(c)
		currgram.shift();
	}
	return result.join("");
}