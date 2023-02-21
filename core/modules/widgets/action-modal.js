/*\
title: $:/core/modules/widgets/action-modal.js
type: application/javascript
module-type: widget

Action widget to open a modal.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ModalWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ModalWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ModalWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ModalWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ModalWidget.prototype.refresh = function(changedTiddlers) {
	// Nothing to refresh
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ModalWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		index = 0,
		baseName = "$:/state/modal/";
	if(this.actionTiddler) {
		this.modalState = baseName + index;
		while ($tw.wiki.tiddlerExists(this.modalState)) {
	   		index++;
    		this.modalState = baseName + index;
		}
		$tw.utils.each(this.attributes,function(attribute,name) {
			self.wiki.setText(self.modalState,undefined,name,attribute,undefined);
		});
	}
	return true; // Action was invoked
};

exports["action-modal"] = ModalWidget;

})();
