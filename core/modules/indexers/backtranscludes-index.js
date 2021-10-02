/*\
title: $:/core/modules/indexers/backtranscludes-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers' backtranscludes

\*/
(function(){

/*jslint node: true, browser: true */
/*global modules: false */
"use strict";


function BacktranscludesIndexer(wiki) {
	this.wiki = wiki;
}

BacktranscludesIndexer.prototype.init = function() {
	this.index = null;
}

BacktranscludesIndexer.prototype.rebuild = function() {
	this.index = null;
}

BacktranscludesIndexer.prototype._getTranscludes = function(tiddler) {
	var parser =  this.wiki.parseText(tiddler.fields.type, tiddler.fields.text, {});
	if(parser) {
		return this.wiki.extractTranscludes(parser.tree);
	}
	return [];
}

BacktranscludesIndexer.prototype.update = function(updateDescriptor) {
	if(!this.index) {
		return;
	}
	var newTranscludes = [],
	    oldTranscludes = [],
	    self = this;
	if(updateDescriptor.old.exists) {
		oldTranscludes = this._getTranscludes(updateDescriptor.old.tiddler);
	}
	if(updateDescriptor.new.exists) {
		newTranscludes = this._getTranscludes(updateDescriptor.new.tiddler);
	}

	$tw.utils.each(oldTranscludes,function(transclude) {
		if(self.index[transclude]) {
			delete self.index[transclude][updateDescriptor.old.tiddler.fields.title];
		}
	});
	$tw.utils.each(newTranscludes,function(transclude) {
		if(!self.index[transclude]) {
			self.index[transclude] = Object.create(null);
		}
		self.index[transclude][updateDescriptor.new.tiddler.fields.title] = true;
	});
}

BacktranscludesIndexer.prototype.lookup = function(title) {
	if(!this.index) {
		this.index = Object.create(null);
		var self = this;
		this.wiki.forEachTiddler(function(title,tiddler) {
			var transcludes = self._getTranscludes(tiddler);
			$tw.utils.each(transcludes, function(transclude) {
				if(!self.index[transclude]) {
					self.index[transclude] = Object.create(null);
				}
				self.index[transclude][title] = true;
			});
		});
	}
	if(this.index[title]) {
		return Object.keys(this.index[title]);
	} else {
		return [];
	}
}

exports.BacktranscludesIndexer = BacktranscludesIndexer;

})();
