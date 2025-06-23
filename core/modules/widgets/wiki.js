/*\
title: $:/core/modules/widgets/wiki.js
type: application/javascript
module-type: widget

Text node widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WikiWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WikiWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
WikiWidget.prototype.render = function(parent,nextSibling) {
	this.parentDOMNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
WikiWidget.prototype.execute = function() {
	var self = this;
	this.data = this.getAttribute("json",""); // if no data, set this.wiki to $tw.wiki as a way of resetting to global wiki object?
		//option to provide plugin tiddler format as input? and to save back to that format
	this.saveactions = this.getAttribute("actions");
	let tiddlers = $tw.utils.parseJSONSafe(this.data,[]);
	if(!tiddlers.length) {
		return;
	}
	this.globalWiki = this.wiki;
	this.wiki = new $tw.Wiki({});
	this.wiki.addTiddlers(tiddlers);

	// Prepare refresh mechanism
	var deferredChanges = Object.create(null),
		timerId;
	function refresh() {
		// Process the refresh
		self.refreshChildren(deferredChanges);
		deferredChanges = Object.create(null);
	}
	// Add the change event handler
	this.wiki.addEventListener("change",function(changes) {
		// Check if only tiddlers that are throttled have changed
		var onlyThrottledTiddlersHaveChanged = true;
		for(var title in changes) {
			var tiddler = self.wiki.getTiddler(title);
			if(!self.wiki.isVolatileTiddler(title) && (!tiddler || !(tiddler.hasField("draft.of") || tiddler.hasField("throttle.refresh")))) {
				onlyThrottledTiddlersHaveChanged = false;
			}
		}
		// Defer the change if only drafts have changed
		if(timerId) {
			clearTimeout(timerId);
		}
		timerId = null;
		if(onlyThrottledTiddlersHaveChanged) {
			var timeout = parseInt(self.wiki.getTiddlerText(DRAFT_TIDDLER_TIMEOUT_TITLE,""),10);
			if(isNaN(timeout)) {
				timeout = THROTTLE_REFRESH_TIMEOUT;
			}
			timerId = setTimeout(refresh,timeout);
			$tw.utils.extend(deferredChanges,changes);
		} else {
			$tw.utils.extend(deferredChanges,changes);
			refresh();
		}
	});
	self.addEventListener("tm-savejson",function(event) {
		$tw.rootWidget.invokeActionString(self.saveactions,$tw.rootWidget,event,{"data": this.wiki.getTiddlersAsJson("[all[tiddlers]]",0) });
	});


	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
WikiWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	/*
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	*/
	return false;
};

exports.wiki = WikiWidget;

})();
