/*\
title: $:/plugins/yaisog/modules/filters/fuzzy.js
type: application/javascript
module-type: filteroperator

Filter operator for fuzzy searching for the text in the operand tiddler using the diff-match-patch library

\*/

"use strict";

/*
Search function adapted from exports.search in wiki.js
*/

var dmp = require("$:/core/modules/utils/diff-match-patch/diff_match_patch.js");

function fuzzySearch(text,options) {
	options = options || {};
	var self = this,
		t,
		regExpStr="",
		invert = !!options.invert,
		dmpObject = options.dmpObject;
	// Convert the search string into a regexp for each term
	var terms,
		fuzzyScores = {};
	if(options.literal) {
		if(text.length === 0) {
			terms = null;
		} else {
			terms = text.slice().toLowerCase();
		}
	} else { // words or some
		terms = text.trim().toLowerCase().split(/[^\S\xA0]+/);
		if(terms.length === 1 && terms[0] === "") {
			terms = null;
		}
	}
	// Accumulate the array of fields to be searched or excluded from the search
	var fields = [];
	if(options.field) {
		if($tw.utils.isArray(options.field)) {
			$tw.utils.each(options.field,function(fieldName) {
				if(fieldName) {
					fields.push(fieldName);
				}
			});
		} else {
			fields.push(options.field);
		}
	}
	// Use default fields if none specified and we're not excluding fields (excluding fields with an empty field array is the same as searching all fields)
	if(fields.length === 0 && !options.excludeField) {
		fields.push("title");
		fields.push("tags");
		fields.push("text");
	}

	// Dice coefficient for string similarity
	function diceCoefficient(a, b) {
		if (a === b) return 1;

		const bigrams = new Map();
		for (let i = 0; i < a.length - 1; i++) {
			const bigram = a.slice(i, i + 2);
			bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
		}
		let intersectionSize = 0;
		for (let i = 0; i < b.length - 1; i++) {
			const bigram = b.slice(i, i + 2);
			const count = bigrams.get(bigram) || 0;
			if (count > 0) {
				bigrams.set(bigram, count - 1);
				intersectionSize++;
			}
		}
		return (2.0 * intersectionSize) / (a.length + b.length);
	}

	// Our scoring function
	function scoreMatch(term, haystack, matchPosition) {
		// const substr = haystack.substr(matchPosition, term.length);
		// If we compare against the whole field content, shorter results are scored better
		return diceCoefficient(term, haystack);
	};

	// Function to check a given tiddler for the search term
	function searchTiddler(title) {
		var tiddler = $tw.wiki.getTiddler(title);
		if(!tiddler) {
			tiddler = new $tw.Tiddler({title: title, text: "", type: "text/vnd.tiddlywiki"});
		}
		var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.fields.type] || $tw.config.contentTypeInfo["text/vnd.tiddlywiki"],
			searchFields;
		// Get the list of fields we're searching
		if(options.excludeField) {
			searchFields = Object.keys(tiddler.fields);
			$tw.utils.each(fields,function(fieldName) {
				var p = searchFields.indexOf(fieldName);
				if(p !== -1) {
					searchFields.splice(p,1);
				}
			});
		} else {
			searchFields = fields;
		}

		if(!terms) {
			return true;
		}

		var fuzzyMatched = new Array(terms.length).fill(false); // Track each term separately for words mode
		var bestScore = new Array(terms.length).fill(0); // Initialize with zero score for each search term
		for(var termIndex=0; termIndex<terms.length; termIndex++) { // iterate over all terms
			for(var fieldIndex=0; fieldIndex<searchFields.length; fieldIndex++) { // check which field has the best match score if there are multiple fields with matches
				var fieldName = searchFields[fieldIndex];
				// Don't search the text field if content type is binary
				if(fieldName === "text" && contentTypeInfo.encoding !== "utf8") {
					break;
				}
				var str = tiddler.fields[fieldName];
				if(str) {
					if($tw.utils.isArray(str)) {
						// If the field value is an array, test each regexp against each field array entry and fail if each regexp doesn't match at least one field array entry
						str = str.slice(); // make a copy for lowercase mutation
						for(var s=0; s<str.length; s++) {
							str[s] = str[s].toLowerCase();
							const matchPosition = dmpObject.match_main(str[s], terms[termIndex], 0);
							if(matchPosition !== -1) {
								const score = scoreMatch(terms[termIndex], str[s], matchPosition);
								if(score > bestScore[termIndex]) {
									bestScore[termIndex] = score;
								}
								fuzzyMatched[termIndex] = true;
							}
						}
					} else {
						// If the field isn't an array, force it to a string and test each regexp against it and fail if any do not match
						str = tiddler.getFieldString(fieldName).toLowerCase();
						const matchPosition = dmpObject.match_main(str, terms[termIndex], 0);
						if(matchPosition !== -1) {
							const score = scoreMatch(terms[termIndex], str, matchPosition);
							if(score > bestScore[termIndex]) {
								bestScore[termIndex] = score;
							}
							fuzzyMatched[termIndex] = true;
							// console.log(`Matched "${terms[termIndex]}" in ${fieldName}: ${str} at ${matchPosition}, score: ${score}`);
						}
					}
				}
			}
		}
		if ((options.some && fuzzyMatched.some(Boolean)) || (fuzzyMatched.every(Boolean))) {
			// Store the score for sorting; if multiple terms were matched, their score is accumulated
			var totalScore = bestScore.reduce(function(sum, score) {
				return sum + score;
			}, 0);
			fuzzyScores[title] = totalScore;
			// console.log(`Matched ${title}, score: ${totalScore}`);
			return true;
		}
		return false;
	};
	// Loop through all the tiddlers doing the search
	var results = [],
		source = options.source || this.each;
	source(function(tiddler,title) {
		if(searchTiddler(title) !== invert) {
			results.push(title);
		}
	});
	// Remove any of the results we have to exclude
	if(options.exclude) {
		for(t=0; t<options.exclude.length; t++) {
			var p = results.indexOf(options.exclude[t]);
			if(p !== -1) {
				results.splice(p,1);
			}
		}
	}
	// Sort by score
	if(Object.keys(fuzzyScores).length > 0) {
		results.sort(function(a, b) {
			return fuzzyScores[b] - fuzzyScores[a];
		});
	}
	return results;
};


/*
Export our filter function
*/
exports.fuzzy = function(source,operator,options) {
	var invert = operator.prefix === "!",
		dmpObject = new dmp.diff_match_patch();
	dmpObject.Match_Threshold = Number(options.wiki.getTiddlerText("$:/config/FuzzySearchThreshold")) || 0.4;
	dmpObject.Match_Distance = 100000; // Large value to allow matches anywhere
	if(operator.suffixes) {
		var hasFlag = function(flag) {
				return (operator.suffixes[1] || []).indexOf(flag) !== -1;
			},
			excludeFields = false,
			fieldList = operator.suffixes[0] || [],
			firstField = fieldList[0] || "", 
			firstChar = firstField.charAt(0),
			fields;
		if(firstChar === "-") {
			fields = [firstField.slice(1)].concat(fieldList.slice(1));
			excludeFields = true;
		} else if(fieldList[0] === "*"){
			fields = [];
			excludeFields = true;
		} else {
			fields = fieldList.slice(0);
		}
		return fuzzySearch(operator.operand,{
			source: source,
			invert: invert,
			field: fields,
			excludeField: excludeFields,
			some: hasFlag("some"),
			literal: hasFlag("literal"),
			words: hasFlag("words"),
			dmpObject: dmpObject
		});
	} else {
		return fuzzySearch(operator.operand,{
			source: source,
			invert: invert,
			dmpObject: dmpObject
		});
	}
};
