/*\
title: $:/core/modules/utils/twuri-encoding.js
type: application/javascript
module-type: utils

Utility functions related to permalink/permaview encoding/decoding.

\*/
(function(){

	// The character that will substitute for a space in the URL
	var SPACE_SUBSTITUTE = "_";

	// The character added to the end to avoid ending with `.`, `?`, `!` or the like
	var TRAILER = "_";

	// The character that will separate out the list elements in the URL
	var CONJUNCTION = ";";

	// Those of the allowed url characters claimed by TW
	var CLAIMED = [SPACE_SUBSTITUTE, ":", CONJUNCTION];

	// Non-alphanumeric characters allowed in a URL fragment
	// More information at https://www.rfc-editor.org/rfc/rfc3986#appendix-A
	var VALID_IN_URL_FRAGMENT = "-._~!$&'()*+,;=:@/?".split("");

	// The subset of the pchars we will not percent-encode in permalinks/permaviews
	var SUBSTITUTES = []
	$tw.utils.each(VALID_IN_URL_FRAGMENT, function(c) {
		if (CLAIMED.indexOf(c) === -1) {
			SUBSTITUTES.push(c)
		}
	});

	// A regex to match the percent-encoded characters we will want to replace.
	// Something similar to the following, depending on SPACE and CONJUNCTION
	//     /(%2D|%2E|%7E|%21|%24|%26|%27|%28|%29|%2A|%2B|%3B|%3D|%40|%2F|%3F)/g

	var CHAR_MATCH_STR = []
	$tw.utils.each(SUBSTITUTES, function(c) {
		CHAR_MATCH_STR.push("%" + c.charCodeAt(0).toString(16).toUpperCase())
	})
	var CHAR_MATCH = new RegExp("(" + CHAR_MATCH_STR.join("|") + ")", "g");

	// A regex to match the SPACE_SUBSTITUTE character
	var SPACE_MATCH = new RegExp("(\\" + SPACE_SUBSTITUTE + ")", "g");

	// A regex to match URLs ending with sentence-ending punctuation
	var SENTENCE_ENDING = new RegExp("(\\.|\\!|\\?|\\" + TRAILER + ")$", "g");

	// A regex to match URLs ending with sentence-ending punctuation plus the TRAILER
	var SENTENCE_TRAILING = new RegExp("(\\.|\\!|\\?|\\" + TRAILER + ")\\" + TRAILER + "$", "g");

	// An object mapping the percent encodings back to their source characters
	var PCT_CHAR_MAP = SUBSTITUTES.reduce(function (a, c) {
		a["%" + c.charCodeAt(0).toString(16).toUpperCase()] = c
		return a
	}, {});

	// Convert a URI List Component encoded string (with the `SPACE_SUBSTITUTE`
	// value as an allowed replacement for the space character) to a string
	exports.decodeTWURIList = function(s) {
		var parts = s.replace(SENTENCE_TRAILING, "$1").split(CONJUNCTION);
		var withSpaces = []
		$tw.utils.each(parts, function(s) {
			withSpaces.push(s.replace(SPACE_MATCH, " "))
		});
		var withBrackets  = []
		$tw.utils.each(withSpaces, function(s) {
			withBrackets .push(s.indexOf(" ") >= 0 ? "[[" + s + "]]" : s)
		});
		return $tw.utils.decodeURIComponentSafe(withBrackets.join(" "));
	};

	// Convert a URI Target Component encoded string (with the `SPACE_SUBSTITUTE` 
	// value as an allowed replacement for the space character) to a string
	exports.decodeTWURITarget = function(s) {
		return $tw.utils.decodeURIComponentSafe(
			s.replace(SENTENCE_TRAILING, "$1").replace(SPACE_MATCH, " ")
		)
	};

	// Convert a URIComponent encoded title string (with the `SPACE_SUBSTITUTE`
	// value as an allowed replacement for the space character) to a string
	exports.encodeTiddlerTitle = function(s) {
		var extended = s.replace(SENTENCE_ENDING, "$1" + TRAILER)
		var encoded = encodeURIComponent(extended);
		var substituted = encoded.replace(/\%20/g, SPACE_SUBSTITUTE);
		return substituted.replace(CHAR_MATCH, function(_, c) {
			return PCT_CHAR_MAP[c];
		});
	};

	// Convert a URIComponent encoded filter string (with the `SPACE_SUBSTITUTE`
	// value as an allowed replacement for the space character) to a string
	exports.encodeFilterPath = function(s) {
		var parts = s.replace(SENTENCE_ENDING, "$1" + TRAILER)
			.replace(/\[\[(.+?)\]\]/g, function (_, t) {return t.replace(/ /g, SPACE_SUBSTITUTE )})
			.split(" ");
		var nonEmptyParts = []
		$tw.utils.each(parts, function(p) {
			if (p) {
				nonEmptyParts.push (p)
			}
		});
		var trimmed = [];
		$tw.utils.each(nonEmptyParts, function(s) {
			trimmed.push(s.trim())
		});
		var encoded = [];
		$tw.utils.each(trimmed, function(s) {
			encoded.push(encodeURIComponent(s))
		});
		var substituted = [];
		$tw.utils.each(encoded, function(s) {
			substituted.push(s.replace(/\%20/g, SPACE_SUBSTITUTE))
		});
		var replaced = []
		$tw.utils.each(substituted, function(s) {
			replaced.push(s.replace(CHAR_MATCH, function(_, c) {
				return PCT_CHAR_MAP[c];
			}))
		});
		return replaced.join(CONJUNCTION);
	};
	
})();
	