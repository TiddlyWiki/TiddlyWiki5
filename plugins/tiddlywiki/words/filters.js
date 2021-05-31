/*\
title: $:/plugins/tiddlywiki/words/filters.js
type: application/javascript
module-type: filteroperator

Filter operators

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var WORD_LIST_TITLE = "$:/plugins/tiddlywiki/words/WordList";

/*
Export our filter function
*/
exports.anagrams = function(source,operator,options) {
	// Helper to lowercase the letters of a string and sort the letters into alphabetical order
	var normaliseLetters = function(str) {
		return str.toLowerCase().split("").sort().join("");
	};
	// Create a hashmap of normalised strings to arrays of words
	var anagramList = options.wiki.getCacheForTiddler(WORD_LIST_TITLE,"anagrams",function() {
			var words = options.wiki.getTiddlerText(WORD_LIST_TITLE,"").split("\n"),
				result = {};
console.log(words.length  + " words in dictionary")
			$tw.utils.each(words,function(word) {
				var normalisedWord = normaliseLetters(word);
				if(!(normalisedWord in result)) {
					result[normalisedWord] = [];
				}
				result[normalisedWord].push(word);
			});
console.log(Object.keys(result).length  + " anagrams found")
			return result;
		});
	// Take the anagram of each input word
	var results = [];
	source(function(tiddler,title) {
		// Check if the title contains wildcards
		if(title.indexOf("?") === -1) {
			// If there are no wildcards we can just pull out the anagrams directly
			var anagrams = anagramList[normaliseLetters(title)];
			if(anagrams) {
				Array.prototype.push.apply(results,anagrams);
			}
		}
	});
	return results;
};

})();
