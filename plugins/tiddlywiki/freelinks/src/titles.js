/*\
title: $:/plugins/tiddlywiki/freelinks/titles.js
type: application/javascript
module-type: library

Builds the set of freelinkable titles and the Aho-Corasick automaton over it. Shared by the
text widget and by the indexer that keeps the automaton alive across tiddler writes.

\*/

"use strict";

var AhoCorasick = require("$:/core/modules/utils/aho-corasick.js").AhoCorasick;

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";

/*
Titles that may be freelinked, in the order the wiki reports them. Drafts are left out: they
are transient copies, linking to "Draft of 'Example'" is never useful, and including them
would mean every keystroke changed the set.
*/
exports.eligibleTitles = function(wiki) {
	var targetFilterText = wiki.getTiddlerText(TITLE_TARGET_FILTER),
		titles = targetFilterText ?
			wiki.filterTiddlers(targetFilterText,$tw.rootWidget) :
			wiki.allTitles(),
		eligible = [];

	if(!titles) {
		return eligible;
	}

	for(var i = 0; i < titles.length; i++) {
		var title = titles[i];
		if(!title || title.length === 0 || title.substring(0,3) === "$:/") {
			continue;
		}
		var tiddler = wiki.getTiddler(title);
		if(tiddler && tiddler.hasField("draft.of")) {
			continue;
		}
		eligible.push(title);
	}
	return eligible;
};

exports.sameTitles = function(a,b) {
	if(!a || a.length !== b.length) {
		return false;
	}
	for(var i = 0; i < a.length; i++) {
		if(a[i] !== b[i]) {
			return false;
		}
	}
	return true;
};

exports.buildTitleInfo = function(sourceTitles,ignoreCase) {
	var empty = {
		titles: [],
		ac: new AhoCorasick(),
		sourceTitles: sourceTitles
	};

	if(sourceTitles.length === 0) {
		return empty;
	}

	var sortedTitles = sourceTitles.slice();
	sortedTitles.sort(function(a,b) {
		var d = b.length - a.length;
		if(d !== 0) return d;
		return a < b ? -1 : a > b ? 1 : 0;
	});

	var ac = new AhoCorasick();
	for(var j = 0; j < sortedTitles.length; j++) {
		var title = sortedTitles[j];
		ac.addPattern(ignoreCase ? title.toLowerCase() : title,j);
	}

	try {
		ac.buildFailureLinks();
	} catch(e) {
		// The size guard is the one failure this code anticipates. Anything else is a defect
		// and must not be turned into "freelinking quietly does nothing".
		if(e.code !== "AHO_MAX_NODES") {
			throw e;
		}
		console.log("Freelinks: " + e.message + ". Freelinking is disabled; narrow " + TITLE_TARGET_FILTER + ".");
		return empty;
	}

	return {
		titles: sortedTitles,
		ac: ac,
		sourceTitles: sourceTitles
	};
};
