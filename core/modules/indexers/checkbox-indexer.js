/*\
title: $:/core/modules/indexers/checkbox-indexer.js
type: application/javascript
module-type: indexer

Indexes tiddlers that contain wikitext checkbox syntax ([ ], [x], [X]).
Maintains three sets so that the checkbox filter operator can answer
in O(1) per-tiddler instead of scanning every tiddler's text.

\*/

"use strict";

var REGEXP_CHECKED   = /\[[xX]\]/;
var REGEXP_UNCHECKED = /\[ \]/;

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
		checked:   Object.create(null), // titles with at least one [x]/[X]
		unchecked: Object.create(null), // titles with at least one [ ]
		any:       Object.create(null)  // titles with any checkbox at all
	};
	var self = this;
	this.wiki.forEachTiddler(function(title, tiddler) {
		self._classifyTiddler(title, tiddler);
	});
};

CheckboxIndexer.prototype._classifyTiddler = function(title, tiddler) {
	var text = tiddler.fields.text || "";
	var hasChecked   = REGEXP_CHECKED.test(text);
	var hasUnchecked = REGEXP_UNCHECKED.test(text);
	if(hasChecked) {
		this.index.checked[title] = true;
	}
	if(hasUnchecked) {
		this.index.unchecked[title] = true;
	}
	if(hasChecked || hasUnchecked) {
		this.index.any[title] = true;
	}
};

CheckboxIndexer.prototype._removeTiddler = function(title) {
	delete this.index.checked[title];
	delete this.index.unchecked[title];
	delete this.index.any[title];
};

CheckboxIndexer.prototype.update = function(updateDescriptor) {
	if(!this.index) {
		return; // index not yet built, nothing to maintain
	}
	// Remove old entry
	if(updateDescriptor.old.exists) {
		this._removeTiddler(updateDescriptor.old.tiddler.fields.title);
	}
	// Add new entry
	if(updateDescriptor.new.exists) {
		var tiddler = updateDescriptor.new.tiddler;
		this._classifyTiddler(tiddler.fields.title, tiddler);
	}
};

/*
Look up titles by checkbox state.
@param {string} category - "checked", "unchecked", or "any" (default)
@returns {string[]|null} array of titles, or null if index is unavailable
*/
CheckboxIndexer.prototype.lookup = function(category) {
	if(!this.index) {
		this._init();
	}
	var bucket = this.index[category || "any"];
	return bucket ? Object.keys(bucket) : [];
};

exports.CheckboxIndexer = CheckboxIndexer;
