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

	function collectTitlesRecursively(baseTiddler,baseTitle,options) {
		var titlesPointingFromBase = [],
			titlesPointingToBase = [];

		function addToResultsIfNotFoundAlready(list,title) {
			if(list.indexOf(title) !== -1) {
				return false;
			}
			list.push(title);
			return true
		}

		function collectTitlesPointingFrom(tiddler,title,currentDepth) {
			if((options.depth) && (currentDepth++ > options.depth)) {
				return;
			}
			if(addToResultsIfNotFoundAlready(titlesPointingFromBase,title)) {
				if(tiddler) {
					$tw.utils.each(tiddler.getFieldList(options.fieldName),function(targetTitle) {
						collectTitlesPointingFrom(options.wiki.getTiddler(targetTitle),targetTitle,currentDepth);
					});
				}
			}
		}

		function collectTitlesPointingTo(title,currentDepth) {
			if((options.depth) && (currentDepth++ > options.depth)) {
				return;
			}
			if(addToResultsIfNotFoundAlready(titlesPointingToBase,title)) {
				$tw.utils.each(options.wiki.findTiddlersByField(title,options.fieldName),function(targetTitle) {
					collectTitlesPointingTo(targetTitle,currentDepth);
				});
			}
		}

		if((options.direction === "from") || (options.direction === "with")) {
			collectTitlesPointingFrom(baseTiddler,baseTitle,0);
		}
		if((options.direction === "to") || (options.direction === "with")) {
			collectTitlesPointingTo(baseTitle,0);
		}
		return $tw.utils.pushTop(titlesPointingFromBase,titlesPointingToBase);
	}

	/*
	Export our filter function
	*/
	exports.kin = function(source,operator,options) {
		var results = [],
			needsExclusion = operator.prefix === "!",
			suffixes = operator.suffixes || [],
			filterOptions = {
				wiki: options.wiki,
				fieldName: ((suffixes[0] || [])[0] || "tags").toLowerCase(),
				direction: ((suffixes[1] || [])[0] || "with").toLowerCase(),
				depth: Number((suffixes[2] || [])[0]),
			};

		if((operator.operand === "") && (needsExclusion)) {
			return [];
		}

		if(operator.operand !== "") {
			var baseTitle = operator.operand,
				baseTiddler = options.wiki.getTiddler(baseTitle),
				foundTitles = collectTitlesRecursively(baseTiddler,baseTitle,filterOptions);

			source(function(tiddler,title) {
				if(needsExclusion === (foundTitles.indexOf(title) === -1)) {
					results.push(title);
				}
			});
		} else {
			source(function(tiddler,title) {
				results = $tw.utils.pushTop(results,collectTitlesRecursively(tiddler,title,filterOptions));
			});
		}

		return results;
	}
})();
