/*\
title: $:/plugins/yaisog/modules/filters/fuzzy2.js
type: application/javascript
module-type: filteroperator

Filter operator for fuzzy searching for the text in the operand tiddler using the diff-match-patch library (without sorting)

\*/

"use strict";

/*
Search function adapted from exports.search in wiki.js
*/

var dmp = require("$:/core/modules/utils/diff-match-patch/diff_match_patch.js");
const FUZZY_THRESHOLD = 0.4;

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
			terms = [text.toLowerCase()];
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
								fuzzyMatched[termIndex] = true;
							}
						}
					} else {
						// If the field isn't an array, force it to a string and test each regexp against it and fail if any do not match
						str = tiddler.getFieldString(fieldName).toLowerCase();
						const matchPosition = dmpObject.match_main(str, terms[termIndex], 0);
						if(matchPosition !== -1) {
							fuzzyMatched[termIndex] = true;
						}
					}
				}
				// for `literal` and `some` modes, we return when the first match is found
				if(!options.words && fuzzyMatched.some(Boolean)) {
					return true;
				}
			}
		}
		// in `words` mode, all terms must be found
		if (fuzzyMatched.every(Boolean)) {
			return true;
		}
		return false;
	};
	// Loop through all the tiddlers doing the search
	var results = [],
		source = options.source || $tw.utils.each;
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
	return results;
};


/*
Export our filter function
*/
exports.fuzzy2 = function(source,operator,options) {
	var invert = operator.prefix === "!",
		dmpObject = new dmp.diff_match_patch(),
		threshold = Number(options.wiki.getTiddlerText("$:/config/FuzzySearchThreshold",FUZZY_THRESHOLD.toString()));
	dmpObject.Match_Threshold = Number.isNaN(threshold) ? FUZZY_THRESHOLD : threshold;
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

