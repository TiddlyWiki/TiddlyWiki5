/*\
title: $:/plugins/yaisog/modules/filters/dice.js
type: application/javascript
module-type: filteroperator

Filter operator for calculating Dice's string similarity coefficient between the input titles and the parameter
Normalized so that 1 is a perfect match and 0 is no match
In 'words' mode, each term is scored separately and added, so the total score can be greater than 1

\*/

"use strict";

/*
In part adapted from exports.search in wiki.js
*/

// Dice coefficient for string similarity
function diceCoefficient(a, b) {
	var i,
		intersectionSize = 0;
	if(a === b) {
		return 1;
	}
	const bigrams = new Map();
	for(i=0; i<a.length-1; i++) {
		const bigram = a.slice(i, i + 2);
		bigrams.set(bigram,(bigrams.get(bigram) || 0) + 1);
	}
	for(i=0; i<b.length-1; i++) {
		const bigram = b.slice(i, i + 2);
		const count = bigrams.get(bigram) || 0;
		if(count > 0) {
			bigrams.set(bigram, count - 1);
			intersectionSize++;
		}
	}
	return (2.0 * intersectionSize) / (a.length + b.length);
}


// Function to check a given tiddler for the search term
function calculateScore(title,terms) {
	var score = 0,
		termIndex;
	if(!terms) {
		return score;
	}
	title = title.toLowerCase();
	for(termIndex=0; termIndex<terms.length; termIndex++) { // iterate over all terms
		score += diceCoefficient(title,terms[termIndex]);
	}
	return score;
}

function similarity(text,options) {
	options = options || {};
	// Convert the search string into a regexp for each term
	var terms,
		diceScores = {};
	if(options.literal) {
		if(text.length === 0) {
			terms = null;
		} else {
			terms = [text.toLowerCase()];
		}
	} else { // words
		terms = text.trim().toLowerCase().split(/[^\S\xA0]+/);
		if(terms.length === 1 && terms[0] === "") {
			terms = null;
		}
	}

	// Loop through all the tiddlers doing the scoring
	var results = [],
		source = options.source;
	source(function(tiddler,title) {
		results.push(calculateScore(title,terms).toString());
	});
	return results;
}


/*
Export our filter function
*/
exports.dice = function(source,operator,options) {
	source = source || $tw.utils.each;
	if(operator.suffixes) {
		var hasFlag = function(flag) {
				return (operator.suffixes[1] || []).indexOf(flag) !== -1;
			};
		return similarity(operator.operand,{
			source: source,
			literal: hasFlag("literal"),
			words: hasFlag("words")
		});
	} else {
		return similarity(operator.operand,{
			source: source
		});
	}
};

