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
	var newTid = updateDescriptor.new.tiddler;
	var oldTid = updateDescriptor.old.tiddler;
	var noOldTid = oldTid === undefined;

	// a) new tiddler has no tags && no old tiddler -> or
	// b) new tiddler has no tags && old tiddler has no tags -> return early!
	var a=((newTid && newTid.fields && newTid.fields.tags === undefined) && noOldTid),
		b=((newTid && newTid.fields && newTid.fields.tags === undefined) && (oldTid && oldTid.fields && oldTid.fields.tags === undefined));

	if( a || b ) {
		return; // early
	}

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

const t0 = $tw.utils.timer();

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

console.log("--------------- ", $tw.utils.timer(t0), this.iteratorMethod);

};

TagSubIndexer.prototype.update = function(updateDescriptor) {
	this.index = null;
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
