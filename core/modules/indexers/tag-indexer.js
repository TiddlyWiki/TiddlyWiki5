/*\
title: $:/core/modules/indexers/tag-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers with each tag

\*/
(function(){

/*jslint node: true, browser: true */
/*global modules: false */
"use strict";

function TagIndexer(wiki) {
	this.wiki = wiki;
	this.index = null;
	this.addIndexMethods();
}

TagIndexer.prototype.addIndexMethods = function() {
	var self = this;
	this.wiki.each.byTag = function(tag) {
		var titles = self.wiki.allTitles();
		return self.lookup(tag).filter(function(title) {
			return titles.indexOf(title) !== -1;
		});
	};
	this.wiki.eachShadow.byTag = function(tag) {
		var titles = self.wiki.allShadowTitles();
		return self.lookup(tag).filter(function(title) {
			return titles.indexOf(title) !== -1;
		});
	};
	this.wiki.eachTiddlerPlusShadows.byTag = function(tag) {
		return self.lookup(tag).slice(0);
	};
	this.wiki.eachShadowPlusTiddlers.byTag = function(tag) {
		return self.lookup(tag).slice(0);
	};
};

/*
Tear down and then rebuild the index as if all tiddlers have changed
*/
TagIndexer.prototype.rebuild = function() {
	var self = this;
	// Hashmap by tag of array of {isSorted:, titles:[]}
	this.index = Object.create(null);
	// Add all the tags
	this.wiki.eachTiddlerPlusShadows(function(tiddler,title) {
		$tw.utils.each(tiddler.fields.tags,function(tag) {
			if(!self.index[tag]) {
				self.index[tag] = {isSorted: false, titles: [title]};
			} else {
				self.index[tag].titles.push(title);
			}
		});		
	});
};

/*
Update the index in the light of a tiddler value changing; note that the title must be identical. (Renames are handled as a separate delete and create)
oldTiddler: old tiddler value, or null for creation
newTiddler: new tiddler value, or null for deletion
*/
TagIndexer.prototype.update = function(oldTiddler,newTiddler) {
	// Don't update the index if it has yet to be built
	if(this.index === null) {
		return;
	}
	var self = this,
		title = oldTiddler ? oldTiddler.fields.title : newTiddler.fields.title;
	// Handle changes to the tags
	var oldTiddlerTags = (oldTiddler ? (oldTiddler.fields.tags || []) : []),
		newTiddlerTags = (newTiddler ? (newTiddler.fields.tags || []) : []);
	$tw.utils.each(oldTiddlerTags,function(oldTag) {
		if(newTiddlerTags.indexOf(oldTag) === -1) {
			// Deleted tag
			var indexRecord = self.index[oldTag],
				pos = indexRecord.titles.indexOf(title);
			if(pos !== -1) {
				indexRecord.titles.splice(pos,1);
			}
		}
	});
	$tw.utils.each(newTiddlerTags,function(newTag) {
		if(oldTiddlerTags.indexOf(newTag) === -1) {
			// New tag
			var indexRecord = self.index[newTag];
			if(!indexRecord) {
				self.index[newTag] = {isSorted: false, titles: [title]};
			} else {
				indexRecord.titles.push(title);
				indexRecord.isSorted = false;
			}
		}
	});
	// Handle changes to the list field of tags
	var oldTiddlerList = (oldTiddler ? (oldTiddler.fields.list || []) : []),
		newTiddlerList = (newTiddler ? (newTiddler.fields.list || []) : []);
	if(!$tw.utils.isArrayEqual(oldTiddlerList,newTiddlerList)) {
		if(self.index[title]) {
			self.index[title].isSorted = false;			
		}
	}
};

// Lookup the given tag returning an ordered list of tiddler titles
TagIndexer.prototype.lookup = function(tag) {
	// Update the index if it has yet to be built
	if(this.index === null) {
		this.rebuild();
	}
	var indexRecord = this.index[tag];
	if(indexRecord) {
		if(!indexRecord.isSorted) {
			if(this.wiki.sortByList) {
				indexRecord.titles = this.wiki.sortByList(indexRecord.titles,tag);
			}			
			indexRecord.isSorted = true;
		}
		return indexRecord.titles;
	} else {
		return [];
	}
};

exports.TagIndexer = TagIndexer;

})();
