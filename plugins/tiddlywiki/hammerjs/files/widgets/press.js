/*\
title: $:/plugins/tiddlywiki/hammerjs/widgets/press
type: application/javascript
module-type: widget

enable actions triggered on press

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
	
	if(self === this && parent !== undefined && nextSibling !== undefined ) {
		self.renderChildren(parent,nextSibling);
	} else if(self === this) {
		self.refresh();
		parentDomNode = parent;
	} else {
		return false;
	}
	
	if(this.pressTargets === undefined || this.pressTargets === "") {
		return false;
	}

	var pressElementClass;
	var pressMultipleClasses = null;
	if(this.pressTargets.indexOf(' ') !== -1) {
		pressMultipleClasses = true;
		pressElementClass = self.pressTargets.split(' ');
	} else {
		pressElementClass = self.pressTargets;
	}
	
	if(pressElementClass === undefined || pressElementClass === "" || parentDomNode === undefined) {
		return false; 
	}

	var domNodeList = [];
	if (pressMultipleClasses === true) {
		for (var i=0; i < pressElementClass.length;i++) {
			var pressElements = parentDomNode.getElementsByClassName(pressElementClass[i]);
			for (var k=0; k < pressElements.length; k++) {
				domNodeList[i + k] = pressElements[k];
				self.domNodes.push(pressElements[k]);
			}
		}
	} else {
		domNodeList = parentDomNode.getElementsByClassName(pressElementClass);
		self.domNodes.push(domNodeList);
	}

	var isPoppedUp = this.pressPopup && this.isPoppedUp(),
		pressElementIndex;
	
	for(i=0; i < domNodeList.length; i++) {

	pressElementIndex = i;

	var currentElement = domNodeList[i];
	var hammer = new Hammer.Manager(domNodeList[i]);

	// Event Listener to cancel browser popup menu on long press
	currentElement.addEventListener('contextmenu', function(e) {
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
		if (self.pressPopup) {
			self.triggerPopup(e);
		}
		if(self.pressStartActions) {
			self.invokeActionString(self.pressStartActions,self,e);
		}
		return true;
	})
		.on('pressup', function(e) {

			if(self.pressEndActions) {
				self.invokeActionString(self.pressEndActions,self,e);
			}

			if (self.pressPopup === undefined && self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
				self.parentWidget.refreshSelf();
			}
			return true;
		});
	}
};

PressWidget.prototype.isPoppedUp = function() {
	var tiddler = this.wiki.getTiddler(this.pressPopup);
	var result = tiddler && tiddler.fields.text ? $tw.popup.readPopupState(tiddler.fields.text) : false;
	return result;
};

PressWidget.prototype.triggerPopup = function(event) {
	$tw.popup.triggerPopup({
		domNode: this.domNodes[0],
		title: this.pressPopup,
		wiki: this.wiki
	});
};

/*
Compute the internal state of the widget
*/
PressWidget.prototype.execute = function() {
	this.pressTargets = this.getAttribute("targets");
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