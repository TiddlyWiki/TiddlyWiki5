/*\
title: $:/plugins/BTC/tiddly-touch/widgets/pan.js
type: application/javascript
module-type: widget

enable actions triggered on panning

\*/
(function (global) {

"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */

var Widget = require("$:/core/modules/widgets/widget.js").widget;

if (typeof window !== 'undefined') {
	var Hammer = require("$:/plugins/tiddlywiki/hammerjs/hammer.js");
}

var PanWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
PanWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
PanWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	var parentDomNode = parent;
  
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	
	if (self === this && parent !== undefined && nextSibling !== undefined ) {
		self.renderChildren(parent,nextSibling);
	} else if (self === this) {
		self.refresh();
		parentDomNode = parent;
	} else {
		if(self.parentWidget !== undefined) {
			self.parentWidget.refreshSelf();
		}
	}

	if(this.panTargets === undefined) {
		return false;
	}

	var panElementClass;
	var panMultipleClasses = null;

	if(this.panTargets.indexOf(' ') !== -1) {
		panMultipleClasses = true;
		panElementClass = self.panTargets.split(' ');
	} else {
		panElementClass = self.panTargets;
	}

	if(panElementClass === undefined || panElementClass === "" || parentDomNode === undefined) {
		return false;
	}

	var domNodeList = [];

	if (panMultipleClasses === true) {
		for (var i=0; i < elementClass.length; i++) {
			var panElements = parentDomNode.getElementsByClassName(panElementClass[i]);
			for (var k=0; k < panElements.length; k++) {
				domNodeList[i + k] = panElements[k];
			}
		}
	} else {
		domNodeList = parentDomNode.getElementsByClassName(panElementClass);
	}

	var elementIndex;
	var panStartValues = [];

	for(i=0; i < domNodeList.length; i++) {

		elementIndex = i;

		var currentElement = domNodeList[i];

		var hammer = new Hammer.Manager(domNodeList[i]);

		hammer.add(new Hammer.Pan({
			event: 'pan',
			pointers: self.panPointers,
			threshold: self.panThreshold,
			direction: Hammer.DIRECTION_ALL
		}));

		hammer.get('pan');

		var scrollLeft = null,
			scrollTop = null;
	
		var startX = null;
		var startY = null;
		var elementTop = null;
		var elementLeft = null;
		var elementBottom = null;
		var elementRight = null;
		var elementWidth = null;
		var elementHeight = null;
		var startActions = null;
		var singleElement = null;
		var pointerType = null;
		var domNodeRect = null;
		var elementAbsoluteTop = null;
		var elementAbsoluteLeft = null;
		var fieldStartNames = [ 'starting-x', 'starting-y', 'element-top', 'element-left', 'element-bottom', 'element-right', 'element-width', 'element-height', 'pointer-type' ];

		hammer.on('touchmove panstart panmove', function(e) {
			// Set a "dragging" state tiddler - gets deleted when panning ends
			$tw.wiki.setText("$:/state/dragging","text",undefined,"yes",null);

			// Get the current coordinates of the element
			if (domNodeRect === null) {
				domNodeRect = currentElement.getBoundingClientRect();
			}

			if (self.panStartActions && startActions !== "done") {
				self.invokeActionString(self.panStartActions,self,e);
				startActions = "done";
			}

			// Absolute coordinates of the pointer
			scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
			scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			elementAbsoluteLeft = (e.center.x + scrollLeft).toFixed(self.userToFixed);
			elementAbsoluteTop = (e.center.y + scrollTop).toFixed(self.userToFixed);

			// Set values at pan-start only
			if (panStartValues.length === 0) {
				panStartValues[0] = e.center.x.toFixed(self.userToFixed);
				panStartValues[1] = e.center.y.toFixed(self.userToFixed);
				panStartValues[2] = domNodeRect.top.toFixed(self.userToFixed);
				panStartValues[3] = domNodeRect.left.toFixed(self.userToFixed);
				panStartValues[4] = domNodeRect.bottom.toFixed(self.userToFixed);
				panStartValues[5] = domNodeRect.right.toFixed(self.userToFixed);
				panStartValues[6] = domNodeRect.width.toFixed(self.userToFixed);
				panStartValues[7] = domNodeRect.height.toFixed(self.userToFixed);
				panStartValues[8] = e.pointerType;

				for(var t = 0; t<panStartValues.length; t++){
					if(domNodeList.length === 1) {
						singleElement = true;
						self.setField(self.panStateTiddler,fieldStartNames[t],panStartValues[t]);
					} else {
						var fieldName = fieldStartNames[t] + "-" + elementIndex;
						self.setField(self.panStateTiddler,fieldName,panStartValues[t]); 
					}
				}
				
				if(singleElement === true) {
					self.setField(self.panStateTiddler,'delta-x',e.deltaX.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'delta-y',e.deltaY.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-x',e.center.x.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-y',e.center.y.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'absolute-x',elementAbsoluteLeft);
					self.setField(self.panStateTiddler,'absolute-y',elementAbsoluteTop);
				} else {
					self.setField(self.panStateTiddler,'delta-x-' + elementIndex,e.deltaX.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'delta-y-' + elementIndex,e.deltaY.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-x-' + elementIndex,e.center.x.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-y-' + elementIndex,e.center.y.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'absolute-x-' + elementIndex,elementAbsoluteLeft);
					self.setField(self.panStateTiddler,'absolute-y-' + elementIndex,elementAbsoluteTop);
				}
			}

			function panWidgetTimeoutFunction(timestamp) {
				// Invoke actions that should be repeated every cycle if specified
				if(self.panRepeatActions) {
					self.invokeActionString(self.panRepeatActions,self,e);
				}

				if(singleElement === true) {
					self.setField(self.panStateTiddler,'delta-x',e.deltaX.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'delta-y',e.deltaY.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-x',e.center.x.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-y',e.center.y.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'absolute-x',elementAbsoluteLeft);
					self.setField(self.panStateTiddler,'absolute-y',elementAbsoluteTop);
				} else {
					self.setField(self.panStateTiddler,'delta-x-' + elementIndex,e.deltaX.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'delta-y-' + elementIndex,e.deltaY.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-x-' + elementIndex,e.center.x.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'relative-y-' + elementIndex,e.center.y.toFixed(self.userToFixed));
					self.setField(self.panStateTiddler,'absolute-x-' + elementIndex,elementAbsoluteLeft);
					self.setField(self.panStateTiddler,'absolute-y-' + elementIndex,elementAbsoluteTop);
				}
			};
			window.requestAnimationFrame(panWidgetTimeoutFunction);
		})

		.on('panend pancancel touchend mouseup', function(e) {
			startX = null;
			startY = null;
			scrollLeft = null;
			scrollTop = null;
			elementTop = null;
			elementLeft = null;
			elementBottom = null;
			elementRight = null;
			elementWidth = null;
			elementHeight = null;
			startActions = null;
			singleElement = null;
			pointerType = null;
			domNodeRect = null;
			panStartValues = [];

			if(self.panEndActions) {
				self.invokeActionString(self.panEndActions,self,e);
			}

			// Delete the "dragging" state tiddler
			$tw.wiki.deleteTiddler("$:/state/dragging");		
			
			if (self.parentWidget !== undefined) {
				self.parentWidget.refreshSelf();
			}
	  		
	  		return true;
	  	});
	}
};
  
/*
Set the computed values in the state-tiddler fields
*/
PanWidget.prototype.setField = function(tiddler,field,value) {
	$tw.wiki.setText(tiddler,field,undefined,value,{ suppressTimestamp: true });
};

/*
Compute the internal state of the widget
*/
PanWidget.prototype.execute = function() {
	this.panTargets = this.getAttribute("targets", "");
	this.panStateTiddler = this.getAttribute("state","$:/state/pan");
	this.panPointers = parseInt(this.getAttribute("pointers","1"));
	this.panThreshold = parseInt(this.getAttribute("threshold","0"));
	this.userToFixed = parseInt(this.getAttribute("decimals","0"));
	this.panStartActions = this.getAttribute("startactions","");
	this.panRepeatActions = this.getAttribute("repeatactions","");
	this.panEndActions = this.getAttribute("endactions","");
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
PanWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.pan = PanWidget;
})();