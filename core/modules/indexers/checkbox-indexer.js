/*\
title: $:/core/modules/indexers/checkbox-indexer.js
type: application/javascript
module-type: indexer

Indexes tiddlers that contain wikitext checkbox syntax ([ ], [x], [X]).
Maintains checked and unchecked title sets so that the checkbox filter operator can answer
in O(1) per-tiddler instead of scanning every tiddler's text.

\*/

"use strict";

const REGEXP_CHECKED   = /\[[xX]\]/;
const REGEXP_UNCHECKED = /\[ \]/;

function CheckboxIndexer(wiki) {
	this.wiki = wiki;
}

CheckboxIndexer.prototype.init = function() {
	this.index = null;
};

CheckboxIndexer.prototype.rebuild = function() {
	this.index = null;
};

/*
Lazy-build the full index the first time it is needed.
*/
CheckboxIndexer.prototype._init = function() {
	this.index = {
		checked:   Object.create(null),
		unchecked: Object.create(null)
	};
	this.wiki.forEachTiddler((title, tiddler) => this._classifyTiddler(title, tiddler));
};

CheckboxIndexer.prototype._classifyTiddler = function(title, tiddler) {
	const text = tiddler.fields.text || "";
	const hasChecked   = REGEXP_CHECKED.test(text);
	const hasUnchecked = REGEXP_UNCHECKED.test(text);
	if(hasChecked)             this.index.checked[title]   = true;
	if(hasUnchecked)           this.index.unchecked[title] = true;
};

CheckboxIndexer.prototype._removeTiddler = function(title) {
	delete this.index.checked[title];
	delete this.index.unchecked[title];
};

CheckboxIndexer.prototype.update = function(updateDescriptor) {
	if(!this.index) return; // index not yet built, nothing to maintain
	if(updateDescriptor.old.exists) {
		this._removeTiddler(updateDescriptor.old.tiddler.fields.title);
	}
	if(updateDescriptor.new.exists) {
		const tiddler = updateDescriptor.new.tiddler;
		this._classifyTiddler(tiddler.fields.title, tiddler);
	}
};

/*
Look up titles by checkbox state.
@param {string} state - "checked" or "unchecked"; omitted means either state
@returns {string[]} array of titles
*/
CheckboxIndexer.prototype.lookup = function(state) {
	if(!this.index) this._init();
	if(state === "checked" || state === "unchecked") {
		return Object.keys(this.index[state]);
	}
	const titles = Object.create(null);
	for(const title of Object.keys(this.index.checked)) {
		titles[title] = true;
	}
	for(const title of Object.keys(this.index.unchecked)) {
		titles[title] = true;
	}
	return Object.keys(titles);
};

exports.CheckboxIndexer = CheckboxIndexer;
