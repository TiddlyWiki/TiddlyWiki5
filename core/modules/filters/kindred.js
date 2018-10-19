/*\
title: $:/core/modules/filters/kindred.js
type: application/javascript
module-type: filteroperator

Filter operator that gathering "family" of tiddler based on <field>

[kindred:<direction>[<field>]]

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	/*
	Export our filter function
	*/
	exports.kindred= function(source,operator,options) {
		var results = [],
			base_title = '',
			direction = (operator.suffix || 'both').toLowerCase(),
			fieldname = (operator.operand || 'tags').toLowerCase();
		source(function(tiddler, title) {
			base_title = title;
			if ((direction === 'up') || (direction === 'both')) {
				findRecursivelyUp(tiddler, title);
			}
			if ((direction === 'down') || (direction === 'both')) {
				findRecursivelyDown(title);
			}
		});

		function addToResultsIfNotFoundAlready(title) {
			// Parse, but do not add the base tiddler
			if (title === base_title) {
				return true;
			}
			if (results.includes(title)) {
				return false;
			}
			results.push(title);
			return true
		}

		function findRecursivelyUp(tiddler, title) {
			if (addToResultsIfNotFoundAlready(title)) {
				if (tiddler) {
					tiddler.getFieldList(fieldname).forEach(function (target_title) {
						findRecursivelyUp(options.wiki.getTiddler(target_title), target_title);
					});
				}
			}
		}

		function findRecursivelyDown(title) {
			if (addToResultsIfNotFoundAlready(title)) {
				options.wiki.findListingsOfTiddler(title, fieldname).forEach(function (target_title) {
					findRecursivelyDown(target_title);
				});
			}
		}

		return results;
	};

})();
