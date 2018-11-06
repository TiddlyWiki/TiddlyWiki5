/*\
title: $:/core/modules/filters/kin.js
type: application/javascript
module-type: filteroperator

Finds out where a tiddler originates from and what other tiddlers originate from it

\*/
(function() {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	// TODO: Should I set global tw to true?

	function collectTitlesRecursively(baseTiddler,baseTitle,fieldName,direction) {
		var titlesPointingFromBase = [],
			titlesPointingToBase = [];

		function addToResultsIfNotFoundAlready(list,title) {
			if(list.includes(title)) {
				return false;
			}
			list.push(title);
			return true
		}

		function collectTitlesPointingFrom(tiddler,title) {
			if(addToResultsIfNotFoundAlready(titlesPointingFromBase,title)) {
				if(tiddler) {
					tiddler.getFieldList(fieldName).forEach(function(targetTitle) {
						collectTitlesPointingFrom($tw.wiki.getTiddler(targetTitle),targetTitle);
					});
				}
			}
		}

		function collectTitlesPointingTo(title) {
			if(addToResultsIfNotFoundAlready(titlesPointingToBase,title)) {
				$tw.wiki.findListingsOfTiddler(title,fieldName).forEach(function(targetTitle) {
					collectTitlesPointingTo(targetTitle);
				});
			}
		}

		if((direction === "from") || (direction === "with")) {
			collectTitlesPointingFrom(baseTiddler,baseTitle);
		}
		if((direction === "to") || (direction === "with")) {
			collectTitlesPointingTo(baseTitle);
		}
		return uniqueArray(titlesPointingFromBase.concat(titlesPointingToBase));
	}

	// TODO: Is there a better way for unique?
	function uniqueArray(input) {
		var seen = {},
			output = [],
			len = input.length,
			j = 0;
		for(var i = 0; i < len; i++) {
			var item = input[i];
			if(seen[item] !== 1) {
				seen[item] = 1;
				output[j++] = item;
			}
		}
		return output;
	}

	/*
	  Export our filter function

	  TODO: May I add tests? (editions/test/tiddlers/tests)
	  */
	exports.kin = function(source,operator,options) {
		var results = [],
			needsExclusion = operator.prefix === "!",
			suffixList = (operator.suffix || "").split(":"),
			fieldName = (suffixList[0] || "tags").toLowerCase(),
			direction = (suffixList[1] || "with").toLowerCase();

		if((operator.operand === "") && (needsExclusion)) {
			return [];
		}

		if(operator.operand !== "") {
			var baseTitle = operator.operand,
				baseTiddler = $tw.wiki.getTiddler(baseTitle),
				foundTitles = collectTitlesRecursively(baseTiddler,baseTitle,fieldName,direction);

			source(function(tiddler,title) {
				if(needsExclusion !== foundTitles.includes(title)) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				results = results.concat(collectTitlesRecursively(tiddler,title,fieldName,direction));
			});
			results = uniqueArray(results);
		}

		return results;
	}
})();
