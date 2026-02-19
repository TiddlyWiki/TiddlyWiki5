/*\
title: $:/core/modules/widgets/droppable.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DroppableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

DroppableWidget.prototype = new Widget();

DroppableWidget.prototype.render = function(parent,nextSibling) {
	var self = this,
		tag = this.parseTreeNode.isBlock ? "div" : "span",
		domNode;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	if(this.droppableTag && $tw.config.htmlUnsafeElements.indexOf(this.droppableTag) === -1) {
		tag = this.droppableTag;
	}

	domNode = this.document.createElement(tag);
	this.domNode = domNode;
	this.assignDomNodeClasses();
	// Assign data- attributes and style. attributes
	this.assignAttributes(domNode,{
		sourcePrefix: "data-",
		destPrefix: "data-"
	});
	// Add event handlers
	if(this.droppableEnable) {
		$tw.utils.addEventListeners(domNode,[
			{name: "dragenter", handlerObject: this, handlerMethod: "handleDragEnterEvent"},
			{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},
			{name: "dragleave", handlerObject: this, handlerMethod: "handleDragLeaveEvent"},
			{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"}
		]);
	} else {
		$tw.utils.addClass(this.domNode,this.disabledClass);
	}

	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	this.renderChildren(domNode,null);
	// Stack of outstanding enter/leave events
	this.currentlyEntered = [];
};

DroppableWidget.prototype.enterDrag = function(event) {
	if(this.currentlyEntered.indexOf(event.target) === -1) {
		this.currentlyEntered.push(event.target);
	}

	$tw.utils.addClass(this.domNodes[0],"tc-dragover");
};

DroppableWidget.prototype.leaveDrag = function(event) {
	var pos = this.currentlyEntered.indexOf(event.target);
	if(pos !== -1) {
		this.currentlyEntered.splice(pos,1);
	}

	if(this.currentlyEntered.length === 0 || (this.currentlyEntered.length === 1 && this.currentlyEntered[0] === $tw.dragInProgress)) {
		this.currentlyEntered = [];
		if(this.domNodes[0]) {
			$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
		}
	}
};

DroppableWidget.prototype.handleDragEnterEvent  = function(event) {
	this.enterDrag(event);
	// Tell the browser that we're ready to handle the drop
	event.preventDefault();
	// Tell the browser not to ripple the drag up to any parent drop handlers
	event.stopPropagation();
	return false;
};

DroppableWidget.prototype.handleDragOverEvent  = function(event) {
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	// Set the drop effect
	event.dataTransfer.dropEffect = this.droppableEffect;
	return false;
};

DroppableWidget.prototype.handleDragLeaveEvent  = function(event) {
	this.leaveDrag(event);
	return false;
};

DroppableWidget.prototype.handleDropEvent  = function(event) {
	var self = this;
	this.leaveDrag(event);
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	var dataTransfer = event.dataTransfer;
	// Remove highlighting
	$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	// Try to import the various data types we understand
	if(this.droppableActions) {
		$tw.utils.importDataTransfer(dataTransfer,null,function(fieldsArray) {
			fieldsArray.forEach(function(fields) {
				self.performActions(fields.title || fields.text,event);
			});
		});
	}

	if(this.droppableListActions) {
		$tw.utils.importDataTransfer(dataTransfer,null,function(fieldsArray) {
			var titleList = [];
			fieldsArray.forEach(function(fields) {
				titleList.push(fields.title || fields.text);
			});
			self.performListActions($tw.utils.stringifyList(titleList),event);
		});
	}

	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
	return false;
};

DroppableWidget.prototype.performListActions = function(titleList,event) {
	if(this.droppableListActions) {
		var modifierKey = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
		this.invokeActionString(this.droppableListActions,this,event,{actionTiddlerList: titleList, modifier: modifierKey});
	}
};

DroppableWidget.prototype.performActions = function(title,event) {
	if(this.droppableActions) {
		var modifierKey = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
		this.invokeActionString(this.droppableActions,this,event,{actionTiddler: title, modifier: modifierKey});
	}
};

DroppableWidget.prototype.execute = function() {
	this.droppableActions = this.getAttribute("actions");
	this.droppableListActions = this.getAttribute("listActions");
	this.droppableEffect = this.getAttribute("effect","copy");
	this.droppableTag = this.getAttribute("tag");
	this.droppableEnable = (this.getAttribute("enable") || "yes") === "yes";
	this.disabledClass = this.getAttribute("disabledClass","");
	// Make child widgets
	this.makeChildWidgets();
};

DroppableWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-droppable");
	this.domNode.className = classes.join(" ").trim();
};

DroppableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tag || changedAttributes.enable || changedAttributes.disabledClass ||
		changedAttributes.actions|| changedAttributes.listActions || changedAttributes.effect) {
		this.refreshSelf();
		return true;
	} else {
		if(changedAttributes["class"]) {
			this.assignDomNodeClasses();
		}
		this.assignAttributes(this.domNodes[0],{
			changedAttributes: changedAttributes,
			sourcePrefix: "data-",
			destPrefix: "data-"
		});
	}
	return this.refreshChildren(changedTiddlers);
};

exports.droppable = DroppableWidget;
