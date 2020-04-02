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
	    oldLinks = [],
	    self = this;
	if(updateDescriptor.old.exists) {
		oldLinks = this._getLinks(updateDescriptor.old.tiddler);
	}
	if(updateDescriptor.new.exists) {
		newLinks = this._getLinks(updateDescriptor.new.tiddler);
	}

	$tw.utils.each(oldLinks,function(link) {
		if(self.index[link]) {
			delete self.index[link][updateDescriptor.old.tiddler.fields.title];
		}
	});
	$tw.utils.each(newLinks,function(link) {
		if(!self.index[link]) {
			self.index[link] = Object.create(null);
		}
		self.index[link][updateDescriptor.new.tiddler.fields.title] = true;
	});
}

BacklinksIndexer.prototype.lookup = function(title) {
	if(!this.index) {
		this.index = Object.create(null);
		var self = this;
		this.wiki.forEachTiddler(function(title,tiddler) {
			var links = self._getLinks(tiddler);
			$tw.utils.each(links, function(link) {
				if(!self.index[link]) {
					self.index[link] = Object.create(null);
				}
				self.index[link][title] = true;
			});
		});
	}
	if(this.index[title]) {
		return Object.keys(this.index[title]);
	} else {
		return [];
	}
}

exports.BacklinksIndexer = BacklinksIndexer;

})();
