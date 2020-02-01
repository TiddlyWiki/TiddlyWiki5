/*\
title: $:/core/modules/indexers/backlinks-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers' backlinks

\*/
(function(){

/*jslint node: true, browser: true */
/*global modules: false */
"use strict";


function BacklinksIndexer(wiki) {
	this.wiki = wiki;
}

BacklinksIndexer.prototype.init = function() {
	this.index = null;
}

BacklinksIndexer.prototype.rebuild = function() {
	this.index = null;
}

BacklinksIndexer.prototype._getLinks = function(tiddler) {
	var parser =  this.wiki.parseText(tiddler.fields.type, tiddler.fields.text, {});
	if(parser) {
		return this.wiki.extractLinks(parser.tree);
	}
	return [];
}

BacklinksIndexer.prototype.update = function(updateDescriptor) {
	if(!this.index) {
		return;
	}
	var newLinks = [],
	    oldLinks = [];
	if(updateDescriptor.old.exists) {
		oldLinks = this._getLinks(updateDescriptor.old.tiddler);
	}
	if(updateDescriptor.new.exists) {
		newLinks = this._getLinks(updateDescriptor.new.tiddler);
	}
	for(var link of oldLinks) {
		if(this.index[link]) {
			this.index[link].delete(updateDescriptor.old.tiddler.fields.title);
		}
	}
	for(var link of newLinks) {
		if(!this.index[link]) {
			this.index[link] = new Set();
		}
		this.index[link].add(updateDescriptor.new.tiddler.fields.title);
	}
}

BacklinksIndexer.prototype.lookup = function(title) {
	if(!this.index) {
		this.index = Object.create(null);
		var self = this;
		this.wiki.forEachTiddler(function(title,tiddler) {
			var links = self._getLinks(tiddler);
			for(var link of links) {
				if(!self.index[link]) {
					self.index[link] = new Set();
				}
				self.index[link].add(title);
			}
		});
	}
	if(this.index[title]) {
		return Array.from(this.index[title]);
	} else {
		return [];
	}
}

exports.BacklinksIndexer = BacklinksIndexer;

})();
