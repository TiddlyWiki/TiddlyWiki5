/*\
title: $:/plugins/tiddlywiki/freelinks/matcher.js
type: application/javascript
module-type: library

Decides which titles earn a link in a run of text. Reads no configuration of its own, so the
render path and the whole tiddler replay behind LinkOnce cannot disagree about the answer.

\*/

"use strict";

// "1984" and "12345.67" are numbers, "Journal 1984" and "5x5" are not
var NUMERIC_TITLE = /^[0-9]+([.,][0-9]+)*$/;

var HEADING_TAGS = {h1: true, h2: true, h3: true, h4: true, h5: true, h6: true};

// Parse tree nodes whose subtree already renders as a link
var LINKING_TAGS = {a: true, "$link": true, "$button": true};

exports.isHeadingNode = function(node) {
	return node.type === "element" && !!HEADING_TAGS[node.tag];
};

exports.isLinkingNode = function(node) {
	return !!node && (node.type === "link" ||
		(node.type === "element" && !!LINKING_TAGS[node.tag]));
};

// A run the parser has already stripped a `~` from, so linking it would undo the escape
exports.isEscapedNode = function(node) {
	return !!node && node.rule === "wikilinkprefix";
};

/*
Choose the matches to link within a single run of text.

Returns the accepted matches together with the positions of any `~` that suppressed one, so
that nothing is written back into the caller's options.
*/
function selectMatches(text,options) {
	var info = options.info,
		matches = info.ac.search(text,options.useWordBoundary,options.ignoreCase),
		result = {matches: [], escapedTildes: null};

	if(!matches || matches.length === 0) {
		return result;
	}

	matches.sort(function(a,b) {
		if(b.length !== a.length) return b.length - a.length;
		return a.index - b.index;
	});

	var occupied = new Uint8Array(text.length),
		seenTitles = options.onceWithinRun ? Object.create(null) : null,
		baseOffset = options.baseOffset || 0;

	for(var i = 0; i < matches.length; i++) {
		if(result.matches.length >= options.maxLinks) break;

		var m = matches[i],
			start = m.index,
			end = start + m.length;
		if(start < 0 || end > text.length) continue;

		var matchedTitle = info.titles[m.titleIndex];
		if(!matchedTitle) continue;

		var overlapping = false;
		for(var j = start; j < end; j++) {
			if(occupied[j]) { overlapping = true; break; }
		}
		if(overlapping) continue;

		// An escaped match still claims its span, so escaping "The Lord of the Rings" cannot
		// release "Lord" and "Rings" to link on their own. Tested before the exclusions below
		// so the escape behaves the same everywhere, including inside the tiddler it names.
		if(options.escapeTilde && start > 0 && text.charAt(start - 1) === "~") {
			if(!result.escapedTildes) {
				result.escapedTildes = new Uint8Array(text.length);
			}
			result.escapedTildes[start - 1] = 1;
			for(var t = start; t < end; t++) {
				occupied[t] = 1;
			}
			continue;
		}

		var matchedTitleToCompare = options.ignoreCase ? matchedTitle.toLowerCase() : matchedTitle;
		if(options.excludeTitle && matchedTitleToCompare === options.excludeTitle) continue;

		// "Journal 1984" is the longer match, so it is accepted and occupies the span before
		// the bare "1984" is ever considered
		if(!options.linkNumbers && NUMERIC_TITLE.test(matchedTitle)) continue;

		if(options.firstOccurrences) {
			if(options.firstOccurrences[m.titleIndex] !== baseOffset + start) continue;
		} else if(seenTitles) {
			if(seenTitles[m.titleIndex]) continue;
			seenTitles[m.titleIndex] = true;
		}

		result.matches.push(m);
		for(var k = start; k < end; k++) {
			occupied[k] = 1;
		}
	}

	return result;
}

/*
Replay the selection across every text run of a tiddler, in document order, and record where
each title first earns a link, so LinkOnce does not depend on render or refresh order.
*/
function collectFirstOccurrences(wiki,title,options) {
	var map = Object.create(null),
		parser = wiki.parseTiddler(title);

	if(!parser || !parser.tree) {
		return map;
	}

	// Every run reached here came from wikitext, so the escape always applies. Without it an
	// escaped first occurrence would claim the link and the next one would stay plain.
	var runOptions = {
		info: options.info,
		ignoreCase: options.ignoreCase,
		useWordBoundary: options.useWordBoundary,
		maxLinks: options.maxLinks,
		linkNumbers: options.linkNumbers,
		excludeTitle: options.excludeTitle,
		escapeTilde: true
	};

	var walk = function(nodes,withinHeading) {
		for(var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if(exports.isLinkingNode(node)) {
				continue;
			}
			var inHeading = withinHeading || exports.isHeadingNode(node);
			if(node.type === "text" && !exports.isEscapedNode(node) &&
				!(inHeading && !options.linkInHeadings) &&
				node.start !== undefined && node.text && node.text.length >= 2) {
				var accepted = selectMatches(node.text,runOptions).matches;
				for(var j = 0; j < accepted.length; j++) {
					var m = accepted[j];
					if(map[m.titleIndex] === undefined) {
						map[m.titleIndex] = node.start + m.index;
					}
				}
			}
			if(node.children) {
				walk(node.children,inHeading);
			}
		}
	};

	walk(parser.tree,false);
	return map;
}

exports.selectMatches = selectMatches;
exports.collectFirstOccurrences = collectFirstOccurrences;
