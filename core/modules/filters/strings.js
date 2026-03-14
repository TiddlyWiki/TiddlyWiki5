/*\
title: $:/core/modules/filters/strings.js
type: application/javascript
module-type: filteroperator

Filter operators for strings. Unary/binary operators work on each item in turn, and return a new item list.

Sum/product/maxall/minall operate on the entire list, returning a single item.

\*/

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
		fnCalc = function(a,b) {return [$tw.utils.trimPrefix(a,b)];};
	} else if(suffix === "suffix") {
		fnCalc = function(a,b) {return [$tw.utils.trimSuffix(a,b)];};
	} else {
		if(operand === "") {
			fnCalc = function(a) {return [$tw.utils.trim(a)];};
		} else {
			fnCalc = function(a,b) {return [$tw.utils.trimSuffix($tw.utils.trimPrefix(a,b),b)];};
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

const dmp = require("$:/core/modules/utils/diff-match-patch/diff_match_patch.js");

exports.levenshtein = makeStringBinaryOperator(
	function(a,b) {
		const diffs = dmp.diffMain(a,b);
		return [dmp.diffLevenshtein(diffs).toString()];
	}
);

// this function is adapted from https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
function diffLineWordMode(text1,text2,mode) {
	var a = $tw.utils.diffPartsToChars(text1,text2,mode);
	var lineText1 = a.chars1;
	var lineText2 = a.chars2;
	var lineArray = a.lineArray;
	var diffs = dmp.diffMain(lineText1,lineText2,false);
	dmp.diffCharsToLines(diffs,lineArray);
	return diffs;
}

exports.makepatches = function(source,operator,options) {
	var suffix = operator.suffix || "",
		result = [];
		
	source(function(tiddler,title) {
		let diffs, patches;
		if(suffix === "lines" || suffix === "words") {
			diffs = diffLineWordMode(title,operator.operand,suffix);
			patches = dmp.patchMake(title,diffs);
		} else {
			patches = dmp.patchMake(title,operator.operand);
		}
		Array.prototype.push.apply(result,[dmp.patchToText(patches)]);
	});

	return result;
};

exports.applypatches = makeStringBinaryOperator(
	function(a,b) {
		let patches;
		try {
			patches = dmp.patchFromText(b);
		} catch(e) {
		}
		if(patches) {
			return [dmp.patchApply(patches,a)[0]];
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
};

exports.charcode = function(source,operator,options) {
	var chars = [];
	$tw.utils.each(operator.operands,function(operand) {
		if(operand !== "") {
			chars.push(String.fromCharCode($tw.utils.parseInt(operand)));
		}
	});
	return [chars.join("")];
};
