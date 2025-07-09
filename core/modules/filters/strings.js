/*\
title: $:/core/modules/filters/strings.js
type: application/javascript
module-type: filteroperator

Filter operators for strings. Unary/binary operators work on each item in turn, and return a new item list.

Sum/product/maxall/minall operate on the entire list, returning a single item.

\*/

"use strict";

exports.length = makeStringBinaryOperator(
	(a) => {return [`${(`${a}`).length}`];}
);

exports.uppercase = makeStringBinaryOperator(
	(a) => {return [(`${a}`).toUpperCase()];}
);

exports.lowercase = makeStringBinaryOperator(
	(a) => {return [(`${a}`).toLowerCase()];}
);

exports.sentencecase = makeStringBinaryOperator(
	(a) => {return [$tw.utils.toSentenceCase(a)];}
);

exports.titlecase = makeStringBinaryOperator(
	(a) => {return [$tw.utils.toTitleCase(a)];}
);

exports.trim = function(source,operator,options) {
	const result = [];
	const suffix = operator.suffix || "";
	const operand = (operator.operand || "");
	let fnCalc;
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
	source((tiddler,title) => {
		Array.prototype.push.apply(result,fnCalc(title,operand));
	});
	return result;
};

exports.split = makeStringBinaryOperator(
	(a,b) => {return (`${a}`).split(b);}
);

exports["enlist-input"] = makeStringBinaryOperator(
	(a,o,s) => {return $tw.utils.parseStringArray(`${a}`,(s === "raw"));}
);

exports.join = makeStringReducingOperator(
	(accumulator,value,operand) => {
		if(accumulator === null) {
			return value;
		} else {
			return accumulator + operand + value;
		}
	},null
);

const dmp = require("$:/core/modules/utils/diff-match-patch/diff_match_patch.js");

exports.levenshtein = makeStringBinaryOperator(
	(a,b) => {
		const dmpObject = new dmp.diff_match_patch();
		const diffs = dmpObject.diff_main(a,b);
		return [`${dmpObject.diff_levenshtein(diffs)}`];
	}
);

// these two functions are adapted from https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
function diffLineWordMode(text1,text2,mode) {
	const dmpObject = new dmp.diff_match_patch();
	const a = diffPartsToChars(text1,text2,mode);
	const lineText1 = a.chars1;
	const lineText2 = a.chars2;
	const {lineArray} = a;
	const diffs = dmpObject.diff_main(lineText1,lineText2,false);
	dmpObject.diff_charsToLines_(diffs,lineArray);
	return diffs;
}

function diffPartsToChars(text1,text2,mode) {
	const lineArray = [];
	const lineHash = {};
	lineArray[0] = '';

	function diff_linesToPartsMunge_(text,mode) {
		let chars = '';
		let lineStart = 0;
		let lineEnd = -1;
		let lineArrayLength = lineArray.length;
		let regexpResult;
		const searchRegexp = /\W+/g;
		while(lineEnd < text.length - 1) {
			if(mode === "words") {
				regexpResult = searchRegexp.exec(text);
				lineEnd = searchRegexp.lastIndex;
				if(regexpResult === null) {
					lineEnd = text.length;
				}
				lineEnd = --lineEnd;
			} else {
				lineEnd = text.indexOf('\n',lineStart);
				if(lineEnd == -1) {
					lineEnd = text.length - 1;
				}
			}
			let line = text.substring(lineStart,lineEnd + 1);

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
	const chars1 = diff_linesToPartsMunge_(text1,mode);
	maxLines = 65535;
	const chars2 = diff_linesToPartsMunge_(text2,mode);
	return {chars1,chars2,lineArray};
};

exports.makepatches = function(source,operator,options) {
	const dmpObject = new dmp.diff_match_patch();
	const suffix = operator.suffix || "";
	const result = [];

	source((tiddler,title) => {
		let diffs; let patches;
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
	(a,b) => {
		const dmpObject = new dmp.diff_match_patch();
		let patches;
		try {
			patches = dmpObject.patch_fromText(b);
		} catch(e) {}
		if(patches) {
			return [dmpObject.patch_apply(patches,a)[0]];
		} else {
			return [a];
		}
	}
);

function makeStringBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		const result = [];
		source((tiddler,title) => {
			Array.prototype.push.apply(result,fnCalc(title,operator.operand || "",operator.suffix || ""));
		});
		return result;
	};
}

function makeStringReducingOperator(fnCalc,initialValue) {
	return function(source,operator,options) {
		const result = [];
		source((tiddler,title) => {
			result.push(title);
		});
		if(result.length === 0) {
			return [];
		}
		return [result.reduce((accumulator,currentValue) => {
			return fnCalc(accumulator,currentValue,operator.operand || "");
		},initialValue) || ""];
	};
}

exports.splitregexp = function(source,operator,options) {
	const result = [];
	const suffix = operator.suffix || "";
	const flags = (suffix.includes("m") ? "m" : "") + (suffix.includes("i") ? "i" : "");
	let regExp;
	try {
		regExp = new RegExp(operator.operand || "",flags);
	} catch(ex) {
		return [`RegExp error: ${ex}`];
	}
	source((tiddler,title) => {
		const parts = title.split(regExp).map((part) => {
			return part || "";	// make sure it's a string
		});
		Array.prototype.push.apply(result,parts);
	});
	return result;
};

exports["search-replace"] = function(source,operator,options) {
	const results = [];
	const suffixes = operator.suffixes || [];
	const flagSuffix = (suffixes[0] ? (suffixes[0][0] || "") : "");
	const flags = (flagSuffix.includes("g") ? "g" : "") + (flagSuffix.includes("i") ? "i" : "") + (flagSuffix.includes("m") ? "m" : "");
	const isRegExp = !!((suffixes[1] && suffixes[1][0] === "regexp"));
	//Escape regexp characters if the operand is not a regular expression
	const searchTerm = isRegExp ? operator.operand : $tw.utils.escapeRegExp(operator.operand);
	//Escape $ character in replacement string if not in regular expression mode
	const replacement = isRegExp ? operator.operands[1] : (operator.operands[1] || "").replace(/\$/g,"$$$$");
	let regExp;
	try {
		regExp = new RegExp(searchTerm,flags);
	} catch(ex) {
		return [`RegExp error: ${ex}`];
	}

	source((tiddler,title) => {
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
	const results = [];
	const targetLength = operator.operand ? parseInt(operator.operand) : 0;
	const fill = operator.operands[1] || "0";

	source((tiddler,title) => {
		if(title && title.length) {
			if(title.length >= targetLength) {
				results.push(title);
			} else {
				let padString = "";
				const padStringLength = targetLength - title.length;
				while(padStringLength > padString.length) {
					padString += fill;
				}
				//make sure we do not exceed the specified length
				padString = padString.slice(0,padStringLength);
				if(operator.suffix && (operator.suffix === "suffix")) {
					title += padString;
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
	const chars = [];
	$tw.utils.each(operator.operands,(operand) => {
		if(operand !== "") {
			chars.push(String.fromCharCode($tw.utils.parseInt(operand)));
		}
	});
	return [chars.join("")];
};
