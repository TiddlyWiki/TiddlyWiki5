/*\
title: $:/plugins/tiddlywiki/hammerjs/widgets/press.js
type: application/javascript
module-type: widget

actions triggered on press gestures

\*/
(function (global) {

"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */

var Widget = require("$:/core/modules/widgets/widget.js").widget;

if (typeof window !== 'undefined') {
	var Hammer = require("$:/plugins/tiddlywiki/hammerjs/hammer.js");
}

var PressWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
PressWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
PressWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	var parentDomNode = parent;
	
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();

	var pressDomNode = this.document.createElement(this.pressTag);
	pressDomNode.setAttribute("class",this.pressClass);
	parent.insertBefore(pressDomNode,nextSibling);
	this.domNodes.push(pressDomNode);
	this.renderChildren(pressDomNode,null);

	var hammer = new Hammer.Manager(pressDomNode);

	// Event Listener to cancel browser popup menu on long press
	pressDomNode.addEventListener('contextmenu', function(e) {
		e.preventDefault && e.preventDefault();
		e.stopPropagation && e.stopPropagation();
		e.cancelBubble = true;
		e.returnValue = false;
		return false;
	});

	hammer.add(new Hammer.Press({
		event: 'press',
		pointers: self.pressPointers,
		threshold: self.pressThreshold,
		time: self.pressTime
	}));
	
	hammer.get('press');
	
	hammer.on('press', function(e) {

		if(self.pressStartActions) {
			self.invokeActionString(self.pressStartActions,self,e);
		}
		return true;
	})
	.on('pressup', function(e) {

		if(self.pressEndActions) {
			self.invokeActionString(self.pressEndActions,self,e);
		}

		if (self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
			self.parentWidget.refreshSelf();
		}
		return true;
	});
};

/*
Compute the internal state of the widget
*/
PressWidget.prototype.execute = function() {
	this.pressClass = this.getAttribute("class", "tc-press-element");
	this.pressTag = this.getAttribute("tag", "div");
	this.pressPointers = parseInt(this.getAttribute("pointers","1"));
	this.pressTime = parseInt(this.getAttribute("time","0"));
	this.pressThreshold = parseInt(this.getAttribute("threshold","1000"));
	this.pressStartActions = this.getAttribute("startactions","");
	this.pressEndActions = this.getAttribute("endactions","");
	this.pressPopup = this.getAttribute("popup");
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
PressWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.press = PressWidget;
})();