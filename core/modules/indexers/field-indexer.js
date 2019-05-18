/*\
title: $:/core/modules/indexers/field-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers with each field value

\*/
(function(){

/*jslint node: true, browser: true */
/*global modules: false */
"use strict";

function FieldIndexer(wiki) {
	this.wiki = wiki;
	this.index = null;
	this.addIndexMethods();
}

FieldIndexer.prototype.addIndexMethods = function() {
	var self = this;
	this.wiki.each.hasNonEmptyField = function(name) {
		var titles = self.wiki.allTitles();
		return self.lookupNonEmptyField(name).filter(function(title) {
			return titles.indexOf(title) !== -1;
		});
	};
	this.wiki.eachShadowPlusTiddlers.byField = function(name,value) {
		return self.lookup(name,value).slice(0);
	};
};

/*
Tear down and then rebuild the index as if all tiddlers have changed
*/
FieldIndexer.prototype.rebuild = function() {
	// Invalidate the index so that it will be rebuilt when it is next used
	this.index = null;
};

/*
Build the index for a particular field
*/
FieldIndexer.prototype.buildIndexForField = function(name) {
	var self = this;
	// Hashmap by field name of hashmap by field value of array of tiddler titles
	this.index = this.index || Object.create(null);
	this.index[name] = Object.create(null);
	var baseIndex = this.index[name];
	// Update the index for each tiddler
	this.wiki.eachTiddlerPlusShadows(function(tiddler,title) {
		if(name in tiddler.fields) {
			var value = tiddler.getFieldString(name);
			baseIndex[value] = baseIndex[value] || [];
			baseIndex[value].push(title);			
		}
	});
};

/*
Update the index in the light of a tiddler value changing; note that the title must be identical. (Renames are handled as a separate delete and create)
oldTiddler: old tiddler value, or null for creation
newTiddler: new tiddler value, or null for deletion
*/
FieldIndexer.prototype.update = function(oldTiddler,newTiddler) {
	// Don't do anything if the index hasn't been built yet
	if(this.index === null) {
		return;
	}
	// Remove the old tiddler from the index
	if(oldTiddler) {
		$tw.utils.each(this.index,function(indexEntry,name) {
			if(name in oldTiddler.fields) {
				var value = oldTiddler.getFieldString(name),
					tiddlerList = indexEntry[value];
				if(tiddlerList) {
					var index = tiddlerList.indexOf(oldTiddler.fields.title);
					if(index !== -1) {
						tiddlerList.splice(index,1);
					}
				}
			}
		});
	}
	// Add the new tiddler to the index
	if(newTiddler) {
		$tw.utils.each(this.index,function(indexEntry,name) {
			if(name in newTiddler.fields) {
				var value = newTiddler.getFieldString(name);
				indexEntry[value].push(newTiddler.fields.title);
			}
		});		
	}
};

// Lookup the given field returning a list of tiddler titles
FieldIndexer.prototype.lookup = function(name,value) {
	// Update the index if it has yet to be built
	if(this.index === null || !this.index[name]) {
		this.buildIndexForField(name);
	}
	return this.index[name][value] || [];
};

// Lookup the given field returning a list of tiddler titles
FieldIndexer.prototype.lookupNonEmptyField = function(name) {
	// Update the index if it has yet to be built
	if(this.index === null || !this.index[name]) {
		this.buildIndexForField(name);
	}
	// Collect the tiddlers with this field
	var baseIndex = this.index[name],
		results = [];
	$tw.utils.each(Object.keys(baseIndex),function(value) {
		if(value) {
			$tw.utils.pushTop(results,baseIndex[value]);
		}
	});
	return results;
};

exports.FieldIndexer = FieldIndexer;

})();
