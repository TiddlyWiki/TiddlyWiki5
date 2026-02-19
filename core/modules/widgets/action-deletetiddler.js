/*\
title: $:/core/modules/widgets/action-deletetiddler.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DeleteTiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

DeleteTiddlerWidget.prototype = new Widget();

DeleteTiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

DeleteTiddlerWidget.prototype.execute = function() {
	this.actionFilter = this.getAttribute("$filter");
	this.actionTiddler = this.getAttribute("$tiddler");
};

DeleteTiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$filter"] || changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

DeleteTiddlerWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var tiddlers = [];
	if(this.actionFilter) {
		tiddlers = this.wiki.filterTiddlers(this.actionFilter,this);
	}
	if(this.actionTiddler) {
		tiddlers.push(this.actionTiddler);
	}
	for(var t=0; t<tiddlers.length; t++) {
		this.wiki.deleteTiddler(tiddlers[t]);
	}
	return true; // Action was invoked
};

exports["action-deletetiddler"] = DeleteTiddlerWidget;
