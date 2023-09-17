/*\
title: $:/core/modules/widgets/blockid.js
type: application/javascript
module-type: widget

An invisible element with block id metadata.
\*/
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var BlockIdWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	// only this widget knows target info (if the block is before this node or not), so we need to hook the focus event, and process it here, instead of in the root widget.
	this.hookNavigatedEvent = this.hookNavigatedEvent.bind(this);
	$tw.hooks.addHook("th-navigated",this.hookNavigatedEvent);
};
BlockIdWidget.prototype = new Widget();

BlockIdWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create an invisible DOM element with data that can be accessed from JS or CSS
	this.idNode = this.document.createElement("span");
	this.idNode.setAttribute("data-block-id",this.id);
	this.idNode.setAttribute("data-block-title",this.tiddlerTitle);
	if(this.before) {
		this.idNode.setAttribute("data-before","true");
	}
	this.idNode.className = "tc-block-id";
	parent.insertBefore(this.idNode,nextSibling);
	this.domNodes.push(this.idNode);
};

BlockIdWidget.prototype.hookNavigatedEvent = function(event) {
	if(!event || !event.toBlockId) return event;
	if(event.toBlockId !== this.id) return event;
	if(this.tiddlerTitle && event.navigateTo !== this.tiddlerTitle) return event;
	var baseElement = event.event && event.event.target ? event.event.target.ownerDocument : document;
	var element = this._getTargetElement(baseElement);
	if(element) {
		// if tiddler is already in the story view, just move to it.
		this._scrollToBlockAndHighlight(element);
	} else {
		var self = this;
		// Here we still need to wait for extra time after `duration`, so tiddler dom is actually added to the story view.
		var duration = $tw.utils.getAnimationDuration() + 50;
		setTimeout(function() {
			element = self._getTargetElement(baseElement);
			self._scrollToBlockAndHighlight(element);
		}, duration);
	}
	return false;
};

BlockIdWidget.prototype._getTargetElement = function(baseElement) {
	var selector = "span[data-block-id='"+this.id+"']";
	if(this.tiddlerTitle) {
		// allow different tiddler have same block id in the text, and only jump to the one with a same tiddler title.
		selector += "[data-block-title='"+this.tiddlerTitle+"']";
	}
	// re-query the dom node, because `this.idNode.parentNode` might already be removed from document
	var element = $tw.utils.querySelectorSafe(selector,baseElement);
	if(!element || !element.parentNode) return;
	// the actual block is always at the parent level
	element = element.parentNode;
	// need to check if the block is before this node
	if(this.previousSibling && element.previousSibling) {
		element = element.previousSibling;
	}
	return element;
};

BlockIdWidget.prototype._scrollToBlockAndHighlight = function(element) {
	if(!element) return;
	// toggle class to trigger highlight animation
	$tw.utils.removeClass(element,"tc-focus-highlight");
	// We enable the `navigateSuppressNavigation` in LinkWidget when sending `tm-navigate`, otherwise `tm-navigate` will force move to the title
	element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
	element.focus({ focusVisible: true });
	// Using setTimeout to ensure the removal takes effect before adding the class again.
	setTimeout(function() {
		$tw.utils.addClass(element,"tc-focus-highlight");
	}, 50);
};

BlockIdWidget.prototype.removeChildDomNodes = function() {
	$tw.hooks.removeHook("th-navigated",this.hookNavigatedEvent);
};

/*
Compute the internal state of the widget
*/
BlockIdWidget.prototype.execute = function() {
	// Get the id from the parse tree node or manually assigned attributes
	this.id = this.getAttribute("id");
	this.tiddlerTitle = this.getVariable("currentTiddler");
	this.previousSibling = this.getAttribute("previousSibling") === "yes";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BlockIdWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.blockid = BlockIdWidget;
