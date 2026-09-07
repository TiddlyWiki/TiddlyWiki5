/*\
title: $:/plugins/tiddlywiki/freelinks/indexer.js
type: application/javascript
module-type: indexer

Keeps the Aho-Corasick automaton over freelinkable titles.

An indexer rather than a cache because indexers are handed every write as it happens and
survive clearGlobalCache, so a write that cannot have changed the title set costs nothing.

\*/

"use strict";

var titles = require("$:/plugins/tiddlywiki/freelinks/titles.js");

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";
var IGNORE_CASE_TIDDLER = "$:/config/Freelinks/IgnoreCase";

function FreelinksIndexer(wiki) {
	this.wiki = wiki;
}

FreelinksIndexer.prototype.init = function() {
	this.invalidate();
};

FreelinksIndexer.prototype.rebuild = function() {
	this.invalidate();
};

FreelinksIndexer.prototype.invalidate = function() {
	this.info = Object.create(null);
};

FreelinksIndexer.prototype.update = function(updateDescriptor) {
	var tiddler = updateDescriptor["new"].tiddler || updateDescriptor.old.tiddler,
		title = tiddler && tiddler.fields.title;

	if(!title) {
		return;
	}

	if(title === TITLE_TARGET_FILTER || title === IGNORE_CASE_TIDDLER) {
		this.invalidate();
		return;
	}

	// System tiddlers are never freelinkable
	if(title.substring(0,3) === "$:/") {
		return;
	}

	// A target filter can select on any field, so with one set there is no cheap way to know
	// an edit left the set alone. Those wikis are the ones with small sets, where rebuilding
	// costs little.
	if(this.wiki.getTiddlerText(TITLE_TARGET_FILTER)) {
		this.invalidate();
		return;
	}

	// Otherwise the only thing that matters is whether this title moved in or out of the set.
	// Editing a body does not, and neither does creating a draft, which is never eligible.
	if(isEligible(updateDescriptor.old) !== isEligible(updateDescriptor["new"])) {
		this.invalidate();
	}
};

function isEligible(state) {
	return !!(state.exists && state.tiddler && !state.tiddler.hasField("draft.of"));
}

FreelinksIndexer.prototype.getTitleInfo = function(ignoreCase) {
	var key = ignoreCase ? "insensitive" : "sensitive";
	if(!this.info[key]) {
		this.info[key] = titles.buildTitleInfo(titles.eligibleTitles(this.wiki),ignoreCase);
	}
	return this.info[key];
};

exports.FreelinksIndexer = FreelinksIndexer;
