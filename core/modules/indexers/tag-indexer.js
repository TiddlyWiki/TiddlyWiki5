/*\
title: $:/core/modules/indexers/tag-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers with each tag

\*/

"use strict";

function TagIndexer(wiki) {
	this.wiki = wiki;
}

TagIndexer.prototype.init = function() {
	this.subIndexers = [
		new TagSubIndexer(this,"each"),
		new TagSubIndexer(this,"eachShadow"),
		new TagSubIndexer(this,"eachTiddlerPlusShadows"),
		new TagSubIndexer(this,"eachShadowPlusTiddlers")
	];
	$tw.utils.each(this.subIndexers,function(subIndexer) {
		subIndexer.addIndexMethod();
	});
};

TagIndexer.prototype.rebuild = function() {
	$tw.utils.each(this.subIndexers,function(subIndexer) {
		subIndexer.rebuild();
	});
};

TagIndexer.prototype.update = function(updateDescriptor) {
	$tw.utils.each(this.subIndexers,function(subIndexer) {
		subIndexer.update(updateDescriptor);
	});
};

function TagSubIndexer(indexer,iteratorMethod) {
	this.indexer = indexer;
	this.iteratorMethod = iteratorMethod;
	this.index = null; // Hashmap of tag title to {isSorted: bool, titles: [array]} or null if not yet initialised
}

TagSubIndexer.prototype.addIndexMethod = function() {
	var self = this;
	this.indexer.wiki[this.iteratorMethod].byTag = function(tag) {
		return self.lookup(tag).slice(0);
	};
};

TagSubIndexer.prototype.rebuild = function() {
	var self = this;
	// Hashmap by tag of array of {isSorted:, titles:[]}
	this.index = Object.create(null);
	// Add all the tags
	this.indexer.wiki[this.iteratorMethod](function(tiddler,title) {
		$tw.utils.each(tiddler.fields.tags,function(tag) {
			if(!self.index[tag]) {
				self.index[tag] = {isSorted: false, titles: [title]};
			} else {
				self.index[tag].titles.push(title);
			}
		});
	});
};

TagSubIndexer.prototype.update = function(updateDescriptor) {
	// If the index hasn't been built yet, no update needed
	if(this.index === null) {
		return;
	}
	// Determine whether the old/new tiddler is visible to this iterator
	var oldVisible = this._isVisible(updateDescriptor.old),
		newVisible = this._isVisible(updateDescriptor["new"]),
		self = this;
	// Remove old tags from index
	if(oldVisible && updateDescriptor.old.tiddler) {
		var oldTitle = updateDescriptor.old.tiddler.fields.title,
			oldTags = updateDescriptor.old.tiddler.fields.tags || [];
		$tw.utils.each(oldTags,function(tag) {
			if(self.index[tag]) {
				var idx = self.index[tag].titles.indexOf(oldTitle);
				if(idx !== -1) {
					self.index[tag].titles.splice(idx,1);
					if(self.index[tag].titles.length === 0) {
						delete self.index[tag];
					}
				}
			}
		});
	}
	// Add new tags to index
	if(newVisible && updateDescriptor["new"].tiddler) {
		var newTitle = updateDescriptor["new"].tiddler.fields.title,
			newTags = updateDescriptor["new"].tiddler.fields.tags || [];
		$tw.utils.each(newTags,function(tag) {
			if(!self.index[tag]) {
				self.index[tag] = {isSorted: false, titles: [newTitle]};
			} else if(self.index[tag].titles.indexOf(newTitle) === -1) {
				self.index[tag].titles.push(newTitle);
				self.index[tag].isSorted = false;
			}
		});
	}
};

/*
Determine whether a tiddler described by a descriptor is visible to this sub-indexer's iterator
*/
TagSubIndexer.prototype._isVisible = function(descriptor) {
	if(this.iteratorMethod === "each") {
		return descriptor.exists;
	} else if(this.iteratorMethod === "eachShadow") {
		return descriptor.shadow;
	} else {
		// eachTiddlerPlusShadows and eachShadowPlusTiddlers both visit all tiddlers and shadows
		return descriptor.exists || descriptor.shadow;
	}
};

TagSubIndexer.prototype.lookup = function(tag) {
	// Update the index if it has yet to be built
	if(this.index === null) {
		this.rebuild();
	}
	var indexRecord = this.index[tag];
	if(indexRecord) {
		if(!indexRecord.isSorted) {
			if(this.indexer.wiki.sortByList) {
				indexRecord.titles = this.indexer.wiki.sortByList(indexRecord.titles,tag);
			}
			indexRecord.isSorted = true;
		}
		return indexRecord.titles;
	} else {
		return [];
	}
};


exports.TagIndexer = TagIndexer;
