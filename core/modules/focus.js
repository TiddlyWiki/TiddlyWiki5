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

FocusManager.prototype.getRenderTreeFootprint = function(widget,domNode) {
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

FocusManager.prototype.getWidgetTreeFootprint = function(widget) {
	var node = widget,
		footprint = [];
	while(node) {
		if(node.parentWidget && node.parentWidget.children && node.parentWidget.children.indexOf(node) !== -1) {
			footprint.push(node.parentWidget.children.indexOf(node));
		}
		node = node.parentWidget;
	}
	return footprint.reverse();
};

FocusManager.prototype.getFocusWidgetInfo = function(rootWidget,domNode) {
	// Get the widget owning the currently focused Dom Node
	var focusWidget = this.findWidgetOwningDomNode(rootWidget,domNode),
		renderTreeFootprint,
		widgetTreeFootprint,
		widgetQualifier,
		widgetInfo = {};
	// Collect information about our widget
	if(focusWidget) {
		widgetInfo.renderTreeFootprint = this.getRenderTreeFootprint(focusWidget,domNode);
		widgetInfo.widgetTreeFootprint = this.getWidgetTreeFootprint(focusWidget);
		widgetInfo.widgetQualifier = focusWidget.getStateQualifier() + "_" + focusWidget.generateWidgetTreeFootprint();
		if(focusWidget.engine && focusWidget.engine.getSelectionRange) {
			var selections = focusWidget.engine.getSelectionRange();
			widgetInfo.selectionStart = selections.selectionStart;
			widgetInfo.selectionEnd = selections.selectionEnd;
		}
	}
	return widgetInfo;
};

FocusManager.prototype.findWidgetByQualifier = function(qualifier,widget) {
	if(qualifier) {
		for(var widgetIndex=0; widgetIndex < widget.children.length; widgetIndex++) {
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
	}
	return null;
};

FocusManager.prototype.findWidgetByRenderTreeFootprint = function(widgetTreeFootprint,rootWidget) {
	var index,
		count = 0,
		widget = rootWidget,
		lastFoundWidget;
	if(widgetTreeFootprint) {
		while(count < widgetTreeFootprint.length) {
			index = widgetTreeFootprint[count],
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
	}
	return null;
};

FocusManager.prototype.findWidgetByFootprint = function(rootWidget,widgetInfo) {
	var widget = this.findWidgetByQualifier(widgetInfo.widgetQualifier,rootWidget);
	if(!widget) {
		widget = this.findWidgetByRenderTreeFootprint(widgetInfo.widgetTreeFootprint,rootWidget);
	}
	return widget;
};

FocusManager.prototype.findParentWidgetWithDomNodes = function(widget) {
	while(widget) {
		widget = widget.parentWidget;
		if(widget.domNodes.length > 0 && widget.domNodes[0].childNodes[0] &&
			widget.domNodes[0].childNodes[0].getAttribute && widget.domNodes[0].childNodes[0].getAttribute("hidden") !== "true" &&
			widget.domNodes[0].childNodes[0].nodeType !== Node.TEXT_NODE &&
			widget.domNodes[0].childNodes[0].focus) {
			return widget.domNodes[0].childNodes[0];
		}
	}
	return null;
};

FocusManager.prototype.restoreFocus = function(rootWidget,widgetInfo) {
	var widget = this.findWidgetByFootprint(rootWidget,widgetInfo);
	if(widget) {
		if(!this.interceptFocusPreservation) {
			var footprint = widgetInfo.renderTreeFootprint,
				counter = 0,
				domNode = widget.domNodes[footprint[0]],
				foundDomNode;
			while(domNode) {
				counter++;
				foundDomNode = domNode;
				domNode = domNode.childNodes[footprint[counter]];
			}
			// If we haven't found a Dom Node
			if(foundDomNode === undefined) {
				foundDomNode = this.findParentWidgetWithDomNodes(widget);
			}
			// If the Dom Node is hidden
			if(foundDomNode && foundDomNode.getAttribute && foundDomNode.getAttribute("hidden") === "true") {
				while(foundDomNode && foundDomNode.getAttribute && foundDomNode.getAttribute("hidden") === "true") {
					foundDomNode = this.findParentWidgetWithDomNodes(widget);
				}
			}
			// If the DomNode is a Text Node, use the parent DomNode
			if(foundDomNode && (foundDomNode.nodeType === Node.TEXT_NODE)) {
				foundDomNode = foundDomNode.parentNode;
			}
			// If the Dom Node doesn't have the tabindex attribute set,
			// detect if it's a focusable Dom Node
			if(foundDomNode && foundDomNode.getAttribute && foundDomNode.getAttribute("tabindex") === null) {
				var validTagNames = ["BUTTON","A","INPUT","TEXTAREA"];
				while((foundDomNode.getAttribute && foundDomNode.getAttribute("tabindex") === null) && (foundDomNode && foundDomNode.tagName && validTagNames.indexOf(foundDomNode.tagName.toUpperCase()) === -1)) {
					if(foundDomNode.tagName && foundDomNode.tagName.toUpperCase() === "SPAN" && foundDomNode.childNodes[0]) {
						foundDomNode = foundDomNode.childNodes[0];
					} else {
						foundDomNode = foundDomNode.parentNode;
					}
				}
			}
			// Set an eventual selection-range
			if(foundDomNode && widget.engine && widget.engine.setSelectionRange) {
				widget.engine.setSelectionRange(widgetInfo.selectionStart,widgetInfo.selectionEnd);
			}
			// Now focus the DomNode
			if(foundDomNode && foundDomNode.focus) {
				foundDomNode.focus({preventScroll: true});
			}
		} else {
			this.interceptFocusPreservation = false;
		}
	}
};

exports.FocusManager = FocusManager;

})();
