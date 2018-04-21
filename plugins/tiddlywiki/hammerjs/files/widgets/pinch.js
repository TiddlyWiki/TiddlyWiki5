/*\
title: $:/plugins/tiddlywiki/hammerjs/widgets/pinch.js
type: application/javascript
module-type: widget

actions triggered on pinch gestures + event values

\*/
(function (global) {

"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */

var Widget = require("$:/core/modules/widgets/widget.js").widget;

if (typeof window !== 'undefined') {
	var Hammer = require("$:/plugins/tiddlywiki/hammerjs/hammer.js");
}

var PinchWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
PinchWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
PinchWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	var parentDomNode = parent;
  
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();

	var pinchDomNode = this.document.createElement(this.pinchTag);
	pinchDomNode.setAttribute("class",this.pinchClass);
	parent.insertBefore(pinchDomNode,nextSibling);
	this.domNodes.push(pinchDomNode);
	this.renderChildren(pinchDomNode,null);

	var hammer = new Hammer.Manager(pinchDomNode);

	hammer.add(new Hammer.Pinch({
		event: 'pinch',
		pointers: 2,
		threshold: self.pinchThreshold
	}));

	hammer.get('pinch').set({ enable: true });

	var singleElement = null;
	var firstSet = null;
	var startActions = null;

	hammer.on('pinch pinchstart pinchmove', function(e) {

		if(startActions !== "done") {
			self.invokeActionString(self.pinchStartActions,self,e);
			startActions = "done";
		}

		if(firstSet !== "done") {
			var rotationValue = e.rotation.toFixed(self.userToFixed);
			var scaleValue = e.scale.toFixed(5);
			
			self.setField(self.pinchStateTiddler,'rotation',rotationValue);
			self.setField(self.pinchStateTiddler,'scale',scaleValue);
			firstSet = "done";
		}

		function pinchWidgetTimeoutFunction(timestamp) {
			var rotationValue = e.rotation.toFixed(self.userToFixed);
			var scaleValue = e.scale.toFixed(5);

			self.setField(self.pinchStateTiddler,'rotation',rotationValue);
			self.setField(self.pinchStateTiddler,'scale',scaleValue);
		};
		window.requestAnimationFrame(pinchWidgetTimeoutFunction);
	})
	.on('pinchend pinchcancel touchend', function(e) {
		e.stopPropagation && e.stopPropagation();

		if(self.pinchEndActions) {
			self.invokeActionString(self.pinchEndActions,self,e);
		}

		firstSet = null;
		startActions = null;
		
		if(self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
			self.parentWidget.refreshSelf();
		}
		return true; // Action was invoked
	});
};

/*
Set the computed values in the state-tiddler fields
*/
PinchWidget.prototype.setField = function(tiddler,field,value) {
	$tw.wiki.setText(tiddler,field,undefined,value,{ suppressTimestamp: true });
};

/*
Compute the internal state of the widget
*/
PinchWidget.prototype.execute = function() {
	this.pinchClass = this.getAttribute("class", "tc-pinch-div");
	this.pinchTag = this.getAttribute("tag", "div");
	this.userToFixed = parseInt(this.getAttribute("decimals","0"));
	this.pinchThreshold = parseInt(this.getAttribute("threshold","0"));
	this.pinchStateTiddler = this.getAttribute("statetiddler","$:/state/pinch");
	this.pinchStartActions = this.getAttribute("startactions","");
	this.pinchEndActions = this.getAttribute("endactions","");
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
PinchWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.pinch = PinchWidget;
})();