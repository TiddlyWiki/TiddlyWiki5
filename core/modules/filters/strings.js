/*\
title: $:/core/modules/filters/strings.js
type: application/javascript
module-type: filteroperator

Filter operators for strings. Unary/binary operators work on each item in turn, and return a new item list.

Sum/product/maxall/minall operate on the entire list, returning a single item.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.length = makeStringBinaryOperator(
	function(a) {return ["" + ("" + a).length];}
);

exports.uppercase = makeStringBinaryOperator(
	function(a) {return [("" + a).toUpperCase()];}
);

exports.lowercase = makeStringBinaryOperator(
	function(a) {return [("" + a).toLowerCase()];}
);

exports.sentencecase = makeStringBinaryOperator(
	function(a) {return [$tw.utils.toSentenceCase(a)];}
);

exports.titlecase = makeStringBinaryOperator(
	function(a) {return [$tw.utils.toTitleCase(a)];}
);

exports.trim = function(source,operator,options) {
	var result = [],
		suffix = operator.suffix || "",
		operand = (operator.operand || ""),
		fnCalc;
	if(suffix === "prefix") {
		fnCalc = function(a,b) {return [$tw.utils.trimPrefix(a,b)];}
	} else if(suffix === "suffix") {
		fnCalc = function(a,b) {return [$tw.utils.trimSuffix(a,b)];}
	} else {
		if(operand === "") {
			fnCalc = function(a) {return [$tw.utils.trim(a)];}
		} else {
			fnCalc = function(a,b) {return [$tw.utils.trimSuffix($tw.utils.trimPrefix(a,b),b)];}
		}
	}
	source(function(tiddler,title) {
		Array.prototype.push.apply(result,fnCalc(title,operand));
	});
	return result;
};

exports.split = makeStringBinaryOperator(
	function(a,b) {return ("" + a).split(b);}
);

exports["enlist-input"] = makeStringBinaryOperator(
	function(a,o,s) {return $tw.utils.parseStringArray("" + a,(s === "raw"));}
);

exports.join = makeStringReducingOperator(
	function(accumulator,value,operand) {
		if(accumulator === null) {
			return value;
		} else {
			return accumulator + operand + value;
		}
	},null
);

var dmp = require("$:/core/modules/utils/diff-match-patch/diff_match_patch.js");

exports.levenshtein = makeStringBinaryOperator(
	function(a,b) {
		var dmpObject = new dmp.diff_match_patch(),
			diffs = dmpObject.diff_main(a,b);
		return [dmpObject.diff_levenshtein(diffs) + ""];
	}
);

// these two functions are adapted from https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
function diffLineWordMode(text1,text2,mode) {
	var dmpObject = new dmp.diff_match_patch();
	var a = diffPartsToChars(text1,text2,mode);
	var lineText1 = a.chars1;
	var lineText2 = a.chars2;
	var lineArray = a.lineArray;
	var diffs = dmpObject.diff_main(lineText1,lineText2,false);
	dmpObject.diff_charsToLines_(diffs,lineArray);
	return diffs;
}

function diffPartsToChars(text1,text2,mode) {
	var lineArray = [];
	var lineHash = {};
	lineArray[0] = '';

    function diff_linesToPartsMunge_(text,mode) {
        var chars = '';
        var lineStart = 0;
        var lineEnd = -1;
        var lineArrayLength = lineArray.length,
            regexpResult;
        var searchRegexp = /\W+/g;
        while(lineEnd < text.length - 1) {
	        if(mode === "words") {
                regexpResult = searchRegexp.exec(text);
                lineEnd = searchRegexp.lastIndex;
                if(regexpResult === null) {
                lineEnd = text.length;
                }
                lineEnd = --lineEnd;
            } else {
                lineEnd = text.indexOf('\n', lineStart);
                if(lineEnd == -1) {
                    lineEnd = text.length - 1;
                }
            }
            var line = text.substring(lineStart, lineEnd + 1);

            if(lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) : (lineHash[line] !== undefined)) {
				chars += String.fromCharCode(lineHash[line]);
            } else {
                if(lineArrayLength == maxLines) {
                  line = text.substring(lineStart);
                  lineEnd = text.length;
                }
                chars += String.fromCharCode(lineArrayLength);
                lineHash[line] = lineArrayLength;
                lineArray[lineArrayLength++] = line;
            }
            lineStart = lineEnd + 1;
        }
        return chars;
    }
    var maxLines = 40000;
    var chars1 = diff_linesToPartsMunge_(text1,mode);
    maxLines = 65535;
    var chars2 = diff_linesToPartsMunge_(text2,mode);
    return {chars1: chars1, chars2: chars2, lineArray: lineArray};
};

exports.makepatches = function(source,operator,options) {
	var dmpObject = new dmp.diff_match_patch(),
		suffix = operator.suffix || "",
		result = [];
		
		source(function(tiddler,title) {
			var diffs, patches;
			if(suffix === "lines" || suffix === "words") {
				diffs = diffLineWordMode(title,operator.operand,suffix);
				patches = dmpObject.patch_make(title,diffs);
			} else {
				patches = dmpObject.patch_make(title,operator.operand);
			}
			Array.prototype.push.apply(result,[dmpObject.patch_toText(patches)]);
		});

	return result;
};

exports.applypatches = makeStringBinaryOperator(
	function(a,b) {
		var dmpObject = new dmp.diff_match_patch(),
			patches;
		try {
			patches = dmpObject.patch_fromText(b);
		} catch(e) {
		}
		if(patches) {
			return [dmpObject.patch_apply(patches,a)[0]];
		} else {
			return [a];
		}
	}
);

function makeStringBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		var result = [];
		source(function(tiddler,title) {
			Array.prototype.push.apply(result,fnCalc(title,operator.operand || "",operator.suffix || ""));
		});
		return result;
	};
}

function makeStringReducingOperator(fnCalc,initialValue) {
	return function(source,operator,options) {
		var result = [];
		source(function(tiddler,title) {
			result.push(title);
		});
		if(result.length === 0) {
			return [];
		}
		return [result.reduce(function(accumulator,currentValue) {
			return fnCalc(accumulator,currentValue,operator.operand || "");
		},initialValue) || ""];
	};
}

exports.splitregexp = function(source,operator,options) {
	var result = [],
		suffix = operator.suffix || "",
		flags = (suffix.indexOf("m") !== -1 ? "m" : "") + (suffix.indexOf("i") !== -1 ? "i" : ""),
		regExp;
	try {
		regExp = new RegExp(operator.operand || "",flags);
	} catch(ex) {
		return ["RegExp error: " + ex];
	}
	source(function(tiddler,title) {
		var parts = title.split(regExp).map(function(part){
			return part || "";	// make sure it's a string
		});
		Array.prototype.push.apply(result,parts);
	});
	return result;
};

exports["search-replace"] = function(source,operator,options) {
	var results = [],
		suffixes = operator.suffixes || [],
		flagSuffix = (suffixes[0] ? (suffixes[0][0] || "") : ""),
		flags = (flagSuffix.indexOf("g") !== -1 ? "g" : "") + (flagSuffix.indexOf("i") !== -1 ? "i" : "") + (flagSuffix.indexOf("m") !== -1 ? "m" : ""),
		isRegExp = (suffixes[1] && suffixes[1][0] === "regexp") ? true : false,
		//Escape regexp characters if the operand is not a regular expression
		searchTerm = isRegExp ? operator.operand : $tw.utils.escapeRegExp(operator.operand),
		//Escape $ character in replacement string if not in regular expression mode
		replacement = isRegExp ? operator.operands[1] : (operator.operands[1]||"").replace(/\$/g,"$$$$"),
		regExp;
	try {
		regExp = new RegExp(searchTerm,flags);
	} catch(ex) {
		return ["RegExp error: " + ex];
	}

	source(function(tiddler,title) {
		if(title && (operator.operands.length > 1)) {
			results.push(
				title.replace(regExp,replacement)
			);
			regExp.lastIndex = 0;
		} else {
			results.push(title);
		}
	});
	return results;
};

exports.pad = function(source,operator,options) {
	var results = [],
		targetLength = operator.operand ? parseInt(operator.operand) : 0,
		fill = operator.operands[1] || "0";

	source(function(tiddler,title) {
		if(title && title.length) {
			if(title.length >= targetLength) {
				results.push(title);
			} else {
				var padString = "",
					padStringLength = targetLength - title.length;
				while(padStringLength > padString.length) {
					padString += fill;
				}
				//make sure we do not exceed the specified length
				padString = padString.slice(0,padStringLength);
				if(operator.suffix && (operator.suffix === "suffix")) {
					title = title + padString;
				} else {
					title = padString + title;
				}
				results.push(title);
			}
		}
	});
	return results;
}

exports.charcode = function(source,operator,options) {
	var chars = [];
	$tw.utils.each(operator.operands,function(operand) {
		if(operand !== "") {
			chars.push(String.fromCharCode($tw.utils.parseInt(operand)));
		}
	});
	return [chars.join("")];
};

})();