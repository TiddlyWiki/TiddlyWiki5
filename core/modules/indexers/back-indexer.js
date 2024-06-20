/*\
title: $:/core/modules/indexers/back-indexer.js
type: application/javascript
module-type: indexer

By parsing the tiddler text, indexes the tiddlers' back links, back transclusions, block level back links.

\*/
function BackIndexer(wiki) {
	this.wiki = wiki;
}

BackIndexer.prototype.init = function() {
	this.subIndexers = {
		link: new BackSubIndexer(this,"extractLinks"),
		transclude: new BackSubIndexer(this,"extractTranscludes"),
	};
};

BackIndexer.prototype.rebuild = function() {
	$tw.utils.each(this.subIndexers,function(subIndexer) {
		subIndexer.rebuild();
	});
};

BackIndexer.prototype.update = function(updateDescriptor) {
	$tw.utils.each(this.subIndexers,function(subIndexer) {
		subIndexer.update(updateDescriptor);
	});
};
function BackSubIndexer(indexer,extractor) {
	this.wiki = indexer.wiki;
	this.indexer = indexer;
	this.extractor = extractor;
	/**
	 * {
	 *   [target title, e.g. tiddler title being linked to]:
	 *     {
	 * 		   [source title, e.g. tiddler title that has link syntax in its text]: true
	 * 	   }
	 * }
	 */
	this.index = null;
}

BackSubIndexer.prototype.init = function() {
	// lazy init until first lookup
	this.index = null;
}

BackSubIndexer.prototype._init = function() {
	this.index = Object.create(null);
	var self = this;
	this.wiki.forEachTiddler(function(sourceTitle,tiddler) {
		var newTargets = self._getTarget(tiddler);
		$tw.utils.each(newTargets, function(target) {
			if(!self.index[target]) {
				self.index[target] = Object.create(null);
			}
			self.index[target][sourceTitle] = true;
		});
	});
}

BackSubIndexer.prototype.rebuild = function() {
	this.index = null;
}

/*
* Get things that is being referenced in the text, e.g. tiddler names in the link syntax.
*/
BackSubIndexer.prototype._getTarget = function(tiddler) {
	if(this.wiki.isBinaryTiddler(tiddler.fields.text)) {
		return [];
	}
	var parser = this.wiki.parseText(tiddler.fields.type, tiddler.fields.text, {});
	if(parser) {
		return this.wiki[this.extractor](parser.tree, tiddler.fields.title);
	}
	return [];
}

BackSubIndexer.prototype.update = function(updateDescriptor) {
	// lazy init/update until first lookup
	if(!this.index) {
		return;
	}
	var newTargets = [],
	    oldTargets = [],
	    self = this;
	if(updateDescriptor.old.exists) {
		oldTargets = this._getTarget(updateDescriptor.old.tiddler);
	}
	if(updateDescriptor.new.exists) {
		newTargets = this._getTarget(updateDescriptor.new.tiddler);
	}

	$tw.utils.each(oldTargets,function(target) {
		if(self.index[target]) {
			delete self.index[target][updateDescriptor.old.tiddler.fields.title];
		}
	});
	$tw.utils.each(newTargets,function(target) {
		if(!self.index[target]) {
			self.index[target] = Object.create(null);
		}
		self.index[target][updateDescriptor.new.tiddler.fields.title] = true;
	});
}

BackSubIndexer.prototype.lookup = function(title) {
	if(!this.index) {
		this._init();
	}
	if(this.index[title]) {
		return Object.keys(this.index[title]);
	} else {
		return [];
	}
}

exports.BackIndexer = BackIndexer;
