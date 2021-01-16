/*\
title: $:/core/modules/focus.js
type: application/javascript
module-type: global

Focus handling utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function FocusManager(options) {
	var options = options || "";
}

FocusManager.prototype.findWidgetOwningDomNode = function(widget,domNode) {
  for(var domNodeIndex=0; domNodeIndex<widget.domNodes.length; domNodeIndex++) {
		if(widget.domNodes[domNodeIndex] === domNode) {
			var widgetInfo = {
				widget: widget,
				index: domNodeIndex
			};
			if(widget.engine && widget.engine.getSelectionRange) {
				var selections = widget.engine.getSelectionRange();
				widgetInfo.selectionStart = selections.selectionStart,
				widgetInfo.selectionEnd = selections.selectionEnd;
			}
			return widgetInfo;
		}
	}
	for(var childIndex=0; childIndex<widget.children.length; childIndex++) {
		var result = this.findWidgetOwningDomNode(widget.children[childIndex],domNode);
		if(result) {
			return result;
		}
	}
	return null;
};

FocusManager.prototype.generateRenderTreeFootprint = function(widget) {
	var node = widget,
		footprint = [];
	while(node) {
		if(node.parentWidget && node.parentWidget.children) {
			footprint.push(node.parentWidget.children.indexOf(node));
		}
		node = node.parentWidget;
	}
	return footprint.reverse();
};

FocusManager.prototype.findWidgetByFootprint = function(footprint,startingWidget) {
	var index,
		count = 0,
		widget = startingWidget;
	while(count < footprint.length) {
		index = footprint[count];
		if(widget && widget.children && widget.children[index]) {
			widget = widget.children[index];
		}
		count++;
	}
	return widget;
};

FocusManager.prototype.restoreFocus = function(widget,widgetInfo) {
	if(widget && widget.domNodes[widgetInfo.index] && widget.domNodes[widgetInfo.index].focus) {
			widget.domNodes[widgetInfo.index].focus();
			if(widgetInfo.selectionStart && widgetInfo.selectionEnd) {
				if(widgetInfo.widget.engine && widgetInfo.widget.engine.setSelectionRange) {
					widgetInfo.widget.engine.setSelectionRange(widgetInfo.selectionStart,widgetInfo.selectionEnd);
				}
			}
		}
};

exports.FocusManager = FocusManager;

})();
