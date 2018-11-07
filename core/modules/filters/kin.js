/*\
title: $:/core/modules/filters/kin.js
type: application/javascript
module-type: filteroperator

Finds out where a tiddler originates from and what other tiddlers originate from it

\*/
(function() {

	/*jslint node: true, browser: true */
	/*global $tw: true */
	"use strict";

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
					$tw.utils.each(tiddler.getFieldList(fieldName),function(targetTitle) {
						collectTitlesPointingFrom($tw.wiki.getTiddler(targetTitle),targetTitle);
					});
				}
			}
		}

		function collectTitlesPointingTo(title) {
			if(addToResultsIfNotFoundAlready(titlesPointingToBase,title)) {
				$tw.utils.each($tw.wiki.findListingsOfTiddler(title,fieldName),function(targetTitle) {
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
		return $tw.utils.pushTop(titlesPointingFromBase,titlesPointingToBase);
	}

	/*
	  Export our filter function

	  TODO: May I add tests? (editions/test/tiddlers/tests)
	  */
	exports.kin = function(source,operator,options) {
		var results = [],
			needsExclusion = operator.prefix === "!",
			suffixes = operator.suffixes || [],
			fieldName = ((suffixes[0] || [])[0] || "tags").toLowerCase(),
			direction = ((suffixes[1] || [])[0] || "with").toLowerCase();

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
				results = $tw.utils.pushTop(results,collectTitlesRecursively(tiddler,title,fieldName,direction));
			});
		}

		return results;
	}
})();
