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
	this.interceptFocusPreservation = false;
}

FocusManager.prototype.findChildDomNode = function(startingDomNode,domNode) {
	for(var domNodeIndex=0; domNodeIndex<startingDomNode.childNodes.length; domNodeIndex++) {
		if(startingDomNode.childNodes[domNodeIndex] === domNode) {
			return startingDomNode.childNodes[domNodeIndex];
		}
	}
	for(var childIndex=0; childIndex<startingDomNode.childNodes.length; childIndex++) {
		var result = this.findChildDomNode(startingDomNode.childNodes[childIndex],domNode);
		if(result) {
			return result;
		}
	}
	return null;
};

FocusManager.prototype.findWidgetOwningDomNode = function(widget,domNode) {
	for(var domNodeIndex=0; domNodeIndex<widget.domNodes.length; domNodeIndex++) {
		if(widget.domNodes[domNodeIndex] === domNode) {
			return widget;
		}
	}
	for(var childIndex=0; childIndex<widget.children.length; childIndex++) {
		var result = this.findWidgetOwningDomNode(widget.children[childIndex],domNode);
		if(result) {
			return result;
		}
	}
	for(domNodeIndex=0; domNodeIndex<widget.domNodes.length; domNodeIndex++) {
		var childDomNode = this.findChildDomNode(widget.domNodes[domNodeIndex],domNode);
		if(childDomNode) {
			return widget;
		}
	}
	return null;
};

FocusManager.prototype.generateRenderTreeFootprint = function(widget,domNode) {
	var footprint = [];
	while(widget.domNodes.indexOf(domNode) === -1) {
		var domNodeIndex = Array.prototype.indexOf.call(domNode.parentNode.children,domNode);
		footprint.push(domNodeIndex);
		domNode = domNode.parentNode;
	}
	if(widget.domNodes.indexOf(domNode) > -1) {
		footprint.push(widget.domNodes.indexOf(domNode));
	}
	return footprint.reverse();
};

FocusManager.prototype.generateWidgetTreeFootprint = function(widget) {
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

FocusManager.prototype.findWidgetByQualifier = function(qualifier,widget) {
	for(var widgetIndex=0; widgetIndex<widget.children.length; widgetIndex++) {
		var childWidget = widget.children[widgetIndex];
		var childWidgetQualifier = childWidget.getStateQualifier() + "_" + childWidget.generateWidgetTreeFootprint();
		if(childWidgetQualifier === qualifier) {
			return widget.children[widgetIndex];
		}
	}
	for(var childIndex=0; childIndex<widget.children.length; childIndex++) {
		var result = this.findWidgetByQualifier(qualifier,widget.children[childIndex]);
		if(result) {
			return result;
		}
	}	
	return null;
};

FocusManager.prototype.findWidgetByRenderTreeFootprint = function(footprint,startingWidget) {
	var index,
		count = 0,
		widget = startingWidget,
		lastFoundWidget;
	while(count < footprint.length) {
		index = footprint[count],
		lastFoundWidget = widget;
		if(widget && widget.children) {
			widget = widget.children[index];
		}
		if(widget === undefined) {
			break;
		}
		count++;
	}
	if(widget) {
		return widget;
	} else if(lastFoundWidget) {
		return lastFoundWidget;
	}
	return null;
};

FocusManager.prototype.findWidgetByFootprint = function(footprint,startingWidget,widgetQualifier) {
	var widget = this.findWidgetByQualifier(widgetQualifier,startingWidget);
	if(!widget) {
		widget = this.findWidgetByRenderTreeFootprint(footprint,startingWidget);
	}
	return widget;
};

FocusManager.prototype.findParentWidgetWithDomNodes = function(widget) {
	while(widget) {
		widget = widget.parentWidget;
		if(widget.domNodes.length > 0 && widget.domNodes[0].getAttribute("hidden") !== "true" &&
			widget.domNodes[0].nodeType !== Node.TEXT_NODE && widget.domNodes[0].focus) {
			return widget.domNodes[0].childNodes[0];
		}
	}
};

FocusManager.prototype.focusWidget = function(widget,footprint,widgetInfo) {
	if(!this.interceptFocusPreservation) {
		var counter = 0,
			savedDomNode,
			domNode = widget.domNodes[footprint[0]];
		while(domNode) {
			counter++;
			savedDomNode = domNode;
			domNode = domNode.childNodes[footprint[counter]];
		}
		if(savedDomNode && (savedDomNode.nodeType === Node.TEXT_NODE)) {
			savedDomNode = savedDomNode.parentNode;
		}
		if((savedDomNode && savedDomNode.getAttribute && savedDomNode.getAttribute("hidden") === "true") || (savedDomNode === undefined)) {
			savedDomNode = this.findParentWidgetWithDomNodes(widget);
		}
		if(savedDomNode && (savedDomNode.nodeType === Node.TEXT_NODE)) {
			savedDomNode = savedDomNode.parentNode;
		}
		if(savedDomNode && savedDomNode.focus) {
			savedDomNode.focus({preventScroll: true});
		}
		if(widgetInfo.selectionStart && widgetInfo.selectionEnd && widget.engine && widget.engine.setSelectionRange) {
			widget.engine.setSelectionRange(widgetInfo.selectionStart,widgetInfo.selectionEnd);
		}
	} else {
		this.interceptFocusPreservation = false;
	}
};
exports.FocusManager = FocusManager;

})();
