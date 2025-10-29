/*\
title: $:/core/modules/indexers/field-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers with each field value

\*/

"use strict";

var DEFAULT_MAXIMUM_INDEXED_VALUE_LENGTH = 128;

function FieldIndexer(wiki) {
	this.wiki = wiki;
}

FieldIndexer.prototype.init = function() {
	this.index = null;
	this.maxIndexedValueLength = DEFAULT_MAXIMUM_INDEXED_VALUE_LENGTH;
	this.addIndexMethods();
}

// Provided for testing
FieldIndexer.prototype.setMaxIndexedValueLength = function(length) {
	this.index = null;
	this.maxIndexedValueLength = length;
};

FieldIndexer.prototype.addIndexMethods = function() {
	var self = this;
	// get all tiddlers, including those overwrite shadow tiddlers
	this.wiki.each.byField = function(name,value) {
		var lookup = self.lookup(name,value);
		return lookup && lookup.filter(function(title) {
			return self.wiki.tiddlerExists(title)
		});
	};
	// get shadow tiddlers, including shadow tiddlers that is overwritten
	this.wiki.eachShadow.byField = function(name,value) {
		var lookup = self.lookup(name,value);
		return lookup && lookup.filter(function(title) {
			return self.wiki.isShadowTiddler(title)
		});
	};
	this.wiki.eachTiddlerPlusShadows.byField = function(name,value) {
		var lookup = self.lookup(name,value);
		return lookup ? lookup.slice(0) : null;
	};
	this.wiki.eachShadowPlusTiddlers.byField = function(name,value) {
		var lookup = self.lookup(name,value);
		return lookup ? lookup.slice(0) : null;
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
			// Skip any values above the maximum length
			if(value.length < self.maxIndexedValueLength) {
				baseIndex[value] = baseIndex[value] || [];
				baseIndex[value].push(title);
			}
		}
	});
};

/*
Update the index in the light of a tiddler value changing; note that the title must be identical. (Renames are handled as a separate delete and create)
updateDescriptor: {old: {tiddler: <tiddler>, shadow: <boolean>, exists: <boolean>},new: {tiddler: <tiddler>, shadow: <boolean>, exists: <boolean>}}
*/
FieldIndexer.prototype.update = function(updateDescriptor) {
	var self = this;
	// Don't do anything if the index hasn't been built yet
	if(this.index === null) {
		return;
	}
	// Remove the old tiddler from the index
	if(updateDescriptor.old.tiddler) {
		$tw.utils.each(this.index,function(indexEntry,name) {
			if(name in updateDescriptor.old.tiddler.fields) {
				var value = updateDescriptor.old.tiddler.getFieldString(name),
					tiddlerList = indexEntry[value];
				if(tiddlerList) {
					var index = tiddlerList.indexOf(updateDescriptor.old.tiddler.fields.title);
					if(index !== -1) {
						tiddlerList.splice(index,1);
					}
				}
			}
		});
	}
	// Add the new tiddler to the index
	if(updateDescriptor["new"].tiddler) {
		$tw.utils.each(this.index,function(indexEntry,name) {
			if(name in updateDescriptor["new"].tiddler.fields) {
				var value = updateDescriptor["new"].tiddler.getFieldString(name);
				if(value.length < self.maxIndexedValueLength) {
					indexEntry[value] = indexEntry[value] || [];
					indexEntry[value].push(updateDescriptor["new"].tiddler.fields.title);
				}
			}
		});
	}
};

// Lookup the given field returning a list of tiddler titles
FieldIndexer.prototype.lookup = function(name,value) {
	// Fail the lookup if the value is too long
	if(value.length >= this.maxIndexedValueLength) {
		return null;
	}
	// Update the index if it has yet to be built
	if(this.index === null || !this.index[name]) {
		this.buildIndexForField(name);
	}
	return this.index[name][value] || [];
};

exports.FieldIndexer = FieldIndexer;
