/*\
title: $:/plugins/tiddlywiki/bibtex/deserializer.js
type: application/javascript
module-type: tiddlerdeserializer

BibTeX file deserializer

\*/

"use strict";

var bibtexParse = require("$:/plugins/tiddlywiki/bibtex/bibtexParse.js");

var CONFIG_STANDARD = "$:/config/BibTeX/Standard";

// A backslash or brace in these can be part of the address
var RAW_FIELDS = ["url","doi","eprint"];

var ACCENTS = {
	"\"": "̈",
	"'": "́",
	"`": "̀",
	"^": "̂",
	"~": "̃",
	"=": "̄",
	".": "̇",
	"u": "̆",
	"v": "̌",
	"H": "̋",
	"c": "̧",
	"k": "̨",
	"r": "̊",
	"d": "̣",
	"b": "̱"
};

var LETTERS = {
	"ss": "ß",
	"ae": "æ",
	"AE": "Æ",
	"oe": "œ",
	"OE": "Œ",
	"aa": "å",
	"AA": "Å",
	"o": "ø",
	"O": "Ø",
	"l": "ł",
	"L": "Ł",
	"i": "ı",
	"j": "ȷ"
};

var TOKENS = [
	{pattern: /[^\\{}$]+/y, convert: convertPlainText},
	// Braces in math such as $x_{10}$ carry meaning
	{pattern: /\$[^$]*\$/y, convert: keepToken},
	// A line break, consumed whole so its second backslash cannot start a command
	{pattern: /\\\\/y, convert: keepToken},
	{pattern: /\\(["'`^~=.]|[uvHckrdb](?=[\s{]))\s*(?:\{\s*(\\[ij](?![a-zA-Z])|[a-zA-Z])\s*\}|(\\[ij](?![a-zA-Z])|[a-zA-Z]))/y, convert: convertAccent},
	{pattern: /\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j)(?![a-zA-Z])(?:\{\}|\s+)?/y, convert: convertLetter},
	{pattern: /\\([&%_#$])/y, convert: convertEscape},
	{pattern: /[{}]/y, convert: dropToken}
];

var COMMAND = /\\(?:[a-zA-Z]+|[^a-zA-Z])?/y;

/**
Return a matched token unchanged.
@param {RegExpExecArray} match - token match
@returns {string} the token
*/
function keepToken(match) {
	return match[0];
}

/**
Collapse whitespace runs in plain text to one space, as BibTeX does.
@param {RegExpExecArray} match - plain text match
@returns {string} the collapsed text
*/
function convertPlainText(match) {
	return match[0].replace(/[ \t\r\n]+/g," ");
}

/**
Convert a TeX accent command to its composed character.
@param {RegExpExecArray} match - mark, then braced or bare base letter
@returns {string} the accented letter
*/
function convertAccent(match) {
	return ((match[2] || match[3]).slice(-1) + ACCENTS[match[1]]).normalize("NFC");
}

/**
Convert a TeX letter command to its character.
@param {RegExpExecArray} match - letter command name
@returns {string} the letter
*/
function convertLetter(match) {
	return LETTERS[match[1]];
}

/**
Convert a TeX escape to the character it escapes.
@param {RegExpExecArray} match - escaped character
@returns {string} the character
*/
function convertEscape(match) {
	return match[1];
}

/**
Drop a brace, which only protects capitalisation.
@returns {string} an empty string
*/
function dropToken() {
	return "";
}

/**
Find the end of the balanced brace groups that start at a position.
@param {string} text - field value
@param {number} pos - position after a command
@returns {number} position after the last group
*/
function skipGroups(text,pos) {
	while(text[pos] === "{") {
		var depth = 0;
		do {
			if(text[pos] === "\\") {
				pos++;
			} else if(text[pos] === "{") {
				depth++;
			} else if(text[pos] === "}") {
				depth--;
			}
			pos++;
		} while(depth > 0 && pos < text.length);
	}
	return pos;
}

/**
Read and convert the token at a position.
@param {string} text - field value
@param {number} pos - token position
@returns {{text: string, end: number}} converted text and next position
*/
function readToken(text,pos) {
	for(var t = 0; t < TOKENS.length; t++) {
		var token = TOKENS[t];
		token.pattern.lastIndex = pos;
		var match = token.pattern.exec(text);
		if(match) {
			return {text: token.convert(match), end: token.pattern.lastIndex};
		}
	}
	COMMAND.lastIndex = pos;
	if(COMMAND.test(text)) {
		// An unknown command stays as written, with its arguments
		var end = skipGroups(text,COMMAND.lastIndex);
		return {text: text.substring(pos,end), end: end};
	}
	return {text: text[pos], end: pos + 1};
}

/**
Convert the TeX markup in a field value to plain text.
@param {string} text - field value
@returns {string} converted value
*/
function cleanValue(text) {
	var result = "",
		pos = 0;
	while(pos < text.length) {
		var token = readToken(text,pos);
		result += token.text;
		pos = token.end;
	}
	return result.trim();
}

/**
Check whether imports follow BibTeX's own rules and convert values to plain text.
@returns {boolean} true if the config tiddler is set to "yes"
*/
function isStandardMode() {
	var tiddler = $tw.wiki.getTiddler(CONFIG_STANDARD);
	return !!tiddler && tiddler.fields.text === "yes";
}

/**
Parse a BibTeX file into tiddlers.
@param {string} text - BibTeX source
@param {Object} fields - fields of the incoming file
@returns {Object[]} tiddler fields, plus an import error tiddler if any entry was bad
*/
exports["application/x-bibtex"] = function(text,fields) {
	var standard = isStandardMode(),
		parsed = bibtexParse.parse(text,{standard: standard}),
		results = [];
	// Convert each entry
	$tw.utils.each(parsed.entries,function(entry) {
		var fields = {
			title: entry.citationKey,
			"bibtex-entry-type": standard ? entry.entryType.toLowerCase() : entry.entryType
		};
		$tw.utils.each(entry.entryTags,function(value,name) {
			var field = name.toLowerCase();
			fields["bibtex-" + field] = standard && !RAW_FIELDS.includes(field) ? cleanValue(value) : value;
		});
		results.push(fields);
	});
	if(parsed.errors.length > 0) {
		results.push({
			title: "BibTeX import error",
			// Plain text, because a message can quote the imported file
			type: "text/plain",
			text: parsed.errors.map(function(error) {
				return "Line " + error.line + ": " + error.message;
			}).join("\n")
		});
	}
	// Return the output tiddlers
	return results;
};
