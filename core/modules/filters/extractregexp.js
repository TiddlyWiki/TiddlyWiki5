/*\
title: $:/core/modules/filters/extractregexp.js
type: application/javascript
module-type: filteroperator

Extract text matching a regular expression.

Default behaviour:
- Returns the first populated capture group of the first match.
- If there are no capture groups, returns the whole match.

Suffixes:
:0             Whole match
:1             First capture group
:2             Second capture group
...
:all           All populated capture groups of the first match
:matches       First populated capture group of every match
:matches:0     Whole match of every match
:matches:1     First capture group of every match
:matches:2     Second capture group of every match
...
:matches:all   All populated capture groups of every match

\*/

"use strict";

exports.extractregexp = function(source,operator,options) {
	var results = [],
		regexp;

	try {
		regexp = new RegExp(operator.operand);
	} catch(e) {
		return [];
	}

	// Determine suffixes
	var matchMode = "first",
		groupMode = "";

	if(operator.suffix === "matches") {
		matchMode = "all";
		groupMode = operator.suffixes && operator.suffixes[1] || "";
	} else {
		groupMode = operator.suffix || "";
	}

	function extract(match,mode) {
		var extracted = [],
			i,
			index;

		if(!match) {
			return extracted;
		}

		switch(mode) {

			case "":
				// First populated capture group
				if(match.length === 1) {
					extracted.push(match[0]);
				} else {
					for(i = 1; i < match.length; i++) {
						if(match[i] !== undefined) {
							extracted.push(match[i]);
							break;
						}
					}
					if(extracted.length === 0) {
						extracted.push(match[0]);
					}
				}
				break;

			case "all":
				// All populated capture groups
				if(match.length === 1) {
					extracted.push(match[0]);
				} else {
					for(i = 1; i < match.length; i++) {
						if(match[i] !== undefined) {
							extracted.push(match[i]);
						}
					}
				}
				break;

			default:
				// Numeric group selection
				if(/^\d+$/.test(mode)) {
					index = +mode;
					if(index < match.length && match[index] !== undefined) {
						extracted.push(match[index]);
					}
				}
				break;
		}

		return extracted;
	}

	source(function(tiddler,title) {
		var match;

		regexp.lastIndex = 0;

		if(matchMode === "all") {

			while((match = regexp.exec(title))) {

				results.push.apply(results,extract(match,groupMode));

				// Prevent infinite loop for zero-length matches
				if(match[0] === "") {
					regexp.lastIndex++;
				}
			}

		} else {

			match = regexp.exec(title);

			if(match) {
				results.push.apply(results,extract(match,groupMode));
			}

		}
	});

	return results;
};
