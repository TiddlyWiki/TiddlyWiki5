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
	var self = this;
	options = options || "";
	this.tiddlerChangeList = [],
	this.tiddlerActionList = [];
	this.updateTiddlerChangeLists(this.getTiddlerList());
	$tw.wiki.addEventListener("change",function(changes) {
		self.handleTiddlerChanges(changes);
	});
}

TiddlerChangeManager.prototype.getTiddlerList = function() {
	return $tw.wiki.getTiddlersWithTag("$:/tags/TiddlerChangeAction");
};

TiddlerChangeManager.prototype.updateTiddlerChangeLists = function(tiddlerList) {
	this.actionTiddlers = tiddlerList;
	for(var i=0; i<tiddlerList.length; i++) {
		var title = tiddlerList[i],
			tiddlerFields = $tw.wiki.getTiddler(title).fields;
		this.tiddlerChangeList[i] = tiddlerFields["change-tiddler"] !== undefined ? tiddlerFields["change-tiddler"] : undefined;
		this.tiddlerActionList[i] = tiddlerFields.text;
	}
};

TiddlerChangeManager.prototype.handleChangedTiddlerEvent = function(event) {
	var actions = [];
	for(var i=0; i<this.actionTiddlers.length; i++) {
		if(this.tiddlerChangeList[i] !== undefined && $tw.utils.hop(event,this.tiddlerChangeList[i])) {
			actions.push = this.tiddlerActionList[i];
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
		this.updateTiddlerChangeLists(newList);
	}
};

exports.TiddlerChangeManager = TiddlerChangeManager;

})();
