/*\
title: $:/core/modules/widgets/droppable.js
type: application/javascript
module-type: widget

Droppable widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DroppableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DroppableWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DroppableWidget.prototype.render = function(parent,nextSibling) {
	var tag = this.parseTreeNode.isBlock ? "div" : "span",
		domNode;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	if(this.droppableTag && $tw.config.htmlUnsafeElements.indexOf(this.droppableTag) === -1) {
		tag = this.droppableTag;
	}
	// Create element and assign classes
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
			{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"},
			{name: "dragend", handlerObject: this, handlerMethod: "handleDragEndEvent"}
		]);
	} else {
		$tw.utils.addClass(this.domNode,this.disabledClass);
	}
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	this.renderChildren(domNode,null);
	// Stack of outstanding enter/leave events
	this.currentlyEntered = [];
};

/*
Whether the drag is over us. The second condition resolves a problem with Firefox whereby
there is an erroneous dragenter event if the node being dragged is within the dropzone
*/
DroppableWidget.prototype.isEntered = function() {
	return !(this.currentlyEntered.length === 0 ||
		(this.currentlyEntered.length === 1 && this.currentlyEntered[0] === $tw.dragInProgress));
};

/*
Forget entered nodes that have since left the document. A node taken away while the drag was
over it never raises the dragleave that would have balanced its dragenter, and without this
we would believe the drag was still over us for the rest of the drag
*/
DroppableWidget.prototype.pruneEntered = function() {
	this.currentlyEntered = this.currentlyEntered.filter(function(node) {
		return node.isConnected !== false;
	});
};

DroppableWidget.prototype.enterDrag = function(event) {
	this.pruneEntered();
	var wasEntered = this.isEntered();
	if(this.currentlyEntered.indexOf(event.target) === -1) {
		this.currentlyEntered.push(event.target);
	}
	// Only an arrival from outside is an arrival. Crossing between our own children raises a
	// dragenter of its own, and that is not something to tell anyone about twice
	if(wasEntered || !this.isEntered()) {
		return;
	}
	// If we're entering for the first time we need to apply highlighting
	$tw.utils.addClass(this.domNodes[0],"tc-dragover");
	// Invoke any enter actions
	if(this.droppableEnterActions) {
		var modifierKey = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
		this.invokeActionString(this.droppableEnterActions,this,event,{modifier: modifierKey});
	}
};

/*
Forget any outstanding enters and drop the highlighting, without announcing that the drag
has left. A drop is an arrival rather than a departure, so it clears the same state but must
not tell anyone that the drag went away
*/
DroppableWidget.prototype.resetDrag = function() {
	this.currentlyEntered = [];
	if(this.domNodes[0]) {
		$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	}
};

DroppableWidget.prototype.leaveDrag = function(event) {
	this.pruneEntered();
	var wasEntered = this.isEntered(),
		pos = this.currentlyEntered.indexOf(event.target);
	if(pos !== -1) {
		this.currentlyEntered.splice(pos,1);
	}
	// Only a departure by something that had arrived is a departure, and only once we are
	// out of children to be within
	if(!wasEntered || this.isEntered()) {
		return;
	}
	this.resetDrag();
	// Invoke any leave actions
	if(this.droppableLeaveActions) {
		var modifierKey = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
		this.invokeActionString(this.droppableLeaveActions,this,event,{modifier: modifierKey});
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

DroppableWidget.prototype.handleDragEndEvent = function(event) {
	var modifierKey = $tw.keyboardManager.getEventModifierKeyDescriptor(event),
		wasEntered = this.isEntered();
	this.resetDrag();
	// A drag that ends while it is over us has also left us, so say so before saying that the
	// drag itself is over. A drop has already reset us, so this does not follow one
	if(wasEntered && this.droppableLeaveActions) {
		this.invokeActionString(this.droppableLeaveActions,this,event,{modifier: modifierKey});
	}
	// Invoke any end actions
	if(this.droppableEndActions) {
		this.invokeActionString(this.droppableEndActions,this,event,{modifier: modifierKey});
	}
	// Neither prevented nor stopped: dragend belongs to the element being dragged, and it
	// must reach its own handler and any handler above us
	return false;
};

DroppableWidget.prototype.handleDragLeaveEvent = function(event) {
	this.leaveDrag(event);
	return false;
};

DroppableWidget.prototype.handleDropEvent  = function(event) {
	var self = this;
	this.resetDrag();
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	var dataTransfer = event.dataTransfer;
	// Try to import the various data types we understand
	if(this.droppableActions) {
		$tw.utils.importDataTransfer(dataTransfer,null,function(fieldsArray) {
			fieldsArray.forEach(function(fields) {
				self.performActions(fields.title || fields.text,event);
			});
		});
	}
	// Send a TitleList to performListActions
	if(this.droppableListActions) {
		$tw.utils.importDataTransfer(dataTransfer,null,function(fieldsArray) {
			var titleList = [];
			fieldsArray.forEach(function(fields) {
				titleList.push(fields.title || fields.text);
			});
			self.performListActions($tw.utils.stringifyList(titleList),event);
		});
	}
	// Tell the browser that we handled the drop
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

/*
Compute the internal state of the widget
*/
DroppableWidget.prototype.execute = function() {
	this.droppableActions = this.getAttribute("actions");
	this.droppableListActions = this.getAttribute("listActions");
	this.droppableEnterActions = this.getAttribute("dragEnterActions");
	this.droppableLeaveActions = this.getAttribute("dragLeaveActions");
	this.droppableEndActions = this.getAttribute("dragEndActions");
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

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
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
