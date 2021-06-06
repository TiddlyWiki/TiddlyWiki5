/*\
title: $:/core/modules/tiddler-change.js
type: application/javascript
module-type: global
Tiddler change handling utilities
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function TiddlerChangeManager(options) {
	var self = this,
	options = options || "";
	this.tiddlerFilters = [],
	this.tiddlerActions = [],
	this.tiddlerFilterLists = [];
	this.updateTiddlerFilterLists(this.getTiddlerList());
	$tw.wiki.addEventListener("change",function(changes) {
		self.handleTiddlerChanges(changes);
	})
}

TiddlerChangeManager.prototype.getTiddlerList = function() {
	return $tw.wiki.getTiddlersWithTag("$:/tags/TiddlerChangeAction");
};

TiddlerChangeManager.prototype.updateTiddlerFilterLists = function(tiddlerList) {
	this.actionTiddlers = tiddlerList;
	for(var i=0; i<tiddlerList.length; i++) {
		var title = tiddlerList[i],
			tiddlerFields = $tw.wiki.getTiddler(title).fields;
		this.tiddlerFilters[i] = tiddlerFields["tiddler-filter"] !== undefined ? tiddlerFields["tiddler-filter"] : undefined;
		this.tiddlerActions[i] = tiddlerFields.text;
		this.tiddlerFilterLists[i] = $tw.wiki.filterTiddlers(this.tiddlerChangeList[i]);
	}
};

TiddlerChangeManager.prototype.isEqual = function(a,b) {
	if(a === b) {
		return true;
	}
	if(a == null || b == null) {
		return false;
	}
	if(a.length !== b.length) {
		return false;
	}

	for(var i=0; i<a.length; ++i) {
		if(a[i] !== b[i]) {
			return false;
		}
	}
	return true;
};

TiddlerChangeManager.prototype.handleChangedTiddlerEvent = function(event) {
	var actions = [];
	for(var i=0; i<this.actionTiddlers.length; i++) {
		var tiddlerListBefore = this.tiddlerFilterLists[i];
		var tiddlerListNow = $tw.wiki.filterTiddlers(this.tiddlerFilters[i]);
		if(!this.isEqual(tiddlerListNow,tiddlerListBefore)) {
			actions.push(this.tiddlerActions[i]);
			this.tiddlerFilterLists[i] = tiddlerListNow;
		}
	}
	for(i=0; i<actions.length; i++) {
		$tw.rootWidget.invokeActionString(actions[i],$tw.rootWidget);
	}
	return true;
};

TiddlerChangeManager.prototype.handleTiddlerChanges = function(changedTiddlers) {
	var newList = this.getTiddlerList();
	var hasChanged = $tw.utils.hopArray(changedTiddlers,this.actionTiddlers) ? true :
		($tw.utils.hopArray(changedTiddlers,newList) ? true : false);
	// Re-cache tiddlers if something changed
	if(hasChanged) {
		this.updateTiddlerFilterLists(newList);
	}
};

exports.TiddlerChangeManager = TiddlerChangeManager;

})();
