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

FocusManager.prototype.findWidgetOwningDomNode = function(widget,domNode,index) {
	for(var domNodeIndex=0; domNodeIndex<widget.domNodes.length; domNodeIndex++) {
		if(widget.domNodes[domNodeIndex] === domNode) {
			var widgetInfo = {
				widget: widget,
				index: domNodeIndex,
				qualifier: widget.getStateQualifier() + "_" + widget.generateRenderTreeFootprint(),
				widgetIndex: index
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
		var result = this.findWidgetOwningDomNode(widget.children[childIndex],domNode,childIndex);
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

FocusManager.prototype.findWidgetByQualifier = function(qualifier,widget) {
	for(var widgetIndex=0; widgetIndex<widget.children.length; widgetIndex++) {
		var childWidget = widget.children[widgetIndex];
		var childWidgetQualifier = childWidget.getStateQualifier() + "_" + childWidget.generateRenderTreeFootprint();
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

FocusManager.prototype.findParentWidgetWithDomNodes = function(startingWidget,index) {
	var widget = startingWidget;
	while(widget) {
		widget = widget.parentWidget;
		if(widget) {
			for(var i=0; i<widget.children.length; i++) {
				if(widget && widget.children[i].domNodes.length > 0 && widget.children[i].domNodes[index] &&
					widget.children[i].domNodes[index].nodeType !== Node.TEXT_NODE &&
					widget.children[i].domNodes[index].getAttribute("hidden") !== "true" && 
					widget.children[i].domNodes[index].focus) {
					return widget.children[i];
				}
			}
		}
	}
	widget = startingWidget;
	while(widget) {
		widget = widget.parentWidget;
		if(widget) {
			for(var i=0; i<widget.children.length; i++) {
				if(widget && widget.children[i].domNodes.length > 0 && widget.children[i].domNodes[0] &&
					widget.children[i].domNodes[0].nodeType !== Node.TEXT_NODE &&
					widget.children[i].domNodes[0].getAttribute("hidden") !== "true" && 
					widget.children[i].domNodes[0].focus) {
					return widget.children[i];
				}
			}
		}
	}
	return null;
};

FocusManager.prototype.findChildWidgetWithDomNodes = function(widget,index) {
	if(widget.children[index].domNodes.length > 0) {
		return widget.children[index];
	}
	for(var childIndex=0; childIndex<widget.children.length; childIndex++) {
		var result = this.findChildWidgetWithDomNodes(widget.children[childIndex],index);
		if(result) {
			return result;
		}
	}
	return null;
};

FocusManager.prototype.findWidgetByFootprint = function(footprint,startingWidget,widgetInfo) {
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
	if(widget === undefined) {
		widget = this.findWidgetByQualifier(widgetInfo.qualifier,startingWidget);
	}
	if(!widget) {
		widget = lastFoundWidget;
	}
	if(widget && (widget.domNodes.length === 0 || (widget.domNodes[widgetInfo.index] && widget.domNodes[widgetInfo.index].nodeType === Node.TEXT_NODE) ||
		(widget.domNodes[widgetInfo.index] && widget.domNodes[widgetInfo.index].getAttribute("hidden") === "true"))) {
		widget = this.findParentWidgetWithDomNodes(widget,widgetInfo.index);
	}
	while(widget && widget.domNodes[widgetInfo.index] && (widget.domNodes[widgetInfo.index].classList.contains("tc-reveal") || widget.domNodes[widgetInfo.index].classList.contains("tc-keyboard"))) {
		widget = this.findChildWidgetWithDomNodes(widget,widgetInfo.widgetIndex);
	}
	while(widget && !widget.domNodes[widgetInfo.index] && widget.domNodes[0] && (widget.domNodes[0].classList.contains("tc-reveal") || widget.domNodes[0].classList.contains("tc-keyboard"))) {
		widget = this.findChildWidgetWithDomNodes(widget,widgetInfo.widgetIndex);
	}
	return widget;
};

FocusManager.prototype.restoreFocus = function(widget,widgetInfo) {
	if(!this.interceptFocusPreservation && widget && widget.domNodes[widgetInfo.index] && widget.domNodes[widgetInfo.index].focus) {
		widget.domNodes[widgetInfo.index].focus({preventScroll: true});
		if(widgetInfo.selectionStart && widgetInfo.selectionEnd) {
			if(widget.engine && widget.engine.setSelectionRange) {
				widget.engine.setSelectionRange(widgetInfo.selectionStart,widgetInfo.selectionEnd);
			}
		}
	} else if(!this.interceptFocusPreservation && widget && !widget.domNodes[widgetInfo.index] && widget.domNodes[0] && widget.domNodes[0].focus) {
		widget.domNodes[0].focus({preventScroll: true});
		if(widgetInfo.selectionStart && widgetInfo.selectionEnd) {
			if(widget.engine && widget.engine.setSelectionRange) {
				widget.engine.setSelectionRange(widgetInfo.selectionStart,widgetInfo.selectionEnd);
			}
		}
	} else {
		this.interceptFocusPreservation = false;
	}
};

exports.FocusManager = FocusManager;

})();
