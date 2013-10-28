/*\
title: $:/core/modules/new_widgets/link.js
type: application/javascript
module-type: new_widget

Link widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var LinkWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LinkWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LinkWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Get the value of the tw-wikilinks configuration macro
	var wikiLinksMacro = this.getVariable("tw-wikilinks"),
		useWikiLinks = wikiLinksMacro ? !(wikiLinksMacro.trim() === "no") : true;
	// Render the link if required
	if(useWikiLinks) {
		this.renderLink(parent,nextSibling);
	} else {
		// Just insert the link text
		var domNode = this.document.createElement("span");
		parent.insertBefore(domNode,nextSibling);
		this.renderChildren(domNode,null);
		this.domNodes.push(domNode);
	}
};

/*
Render this widget into the DOM
*/
LinkWidget.prototype.renderLink = function(parent,nextSibling) {
	var self = this;
	// Create our element
	var domNode = this.document.createElement("a");
	// Assign classes
	$tw.utils.addClass(domNode,"tw-tiddlylink");
	if(this.isShadow) {
		$tw.utils.addClass(domNode,"tw-tiddlylink-shadow");
	}
	if(this.isMissing && !this.isShadow) {
		$tw.utils.addClass(domNode,"tw-tiddlylink-missing");
	} else {
		if(!this.isMissing) {
			$tw.utils.addClass(domNode,"tw-tiddlylink-resolves");
		}
	}
	// Set an href
	var wikiLinkTemplateMacro = this.getVariable("tw-wikilink-template"),
		wikiLinkTemplate = wikiLinkTemplateMacro ? wikiLinkTemplateMacro.trim() : "#$uri_encoded$",
		wikiLinkText = wikiLinkTemplate.replace("$uri_encoded$",encodeURIComponent(this.to));
	wikiLinkText = wikiLinkText.replace("$uri_doubleencoded$",encodeURIComponent(encodeURIComponent(this.to)));
	domNode.setAttribute("href",wikiLinkText);
	// Add a click event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"},
		{name: "dragstart", handlerObject: this, handlerMethod: "handleDragStartEvent"},
		{name: "dragend", handlerObject: this, handlerMethod: "handleDragEndEvent"}
	]);
	// Insert the link into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

LinkWidget.prototype.handleClickEvent = function (event) {
	// Send the click on it's way as a navigate event
	var bounds = this.domNodes[0].getBoundingClientRect();
	this.dispatchEvent({
		type: "tw-navigate",
		navigateTo: this.to,
		navigateFromNode: this,
		navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		}
	});
	event.preventDefault();
	event.stopPropagation();
	return false;
};

LinkWidget.prototype.handleDragStartEvent = function(event) {
	if(this.to) {
		// Set the dragging class on the element being dragged
		$tw.utils.addClass(event.target,"tw-tiddlylink-dragging");
		// Create the drag image elements
		this.dragImage = this.document.createElement("div");
		this.dragImage.className = "tw-tiddler-dragger";
		var inner = this.document.createElement("div");
		inner.className = "tw-tiddler-dragger-inner";
		inner.appendChild(this.document.createTextNode(this.to));
		this.dragImage.appendChild(inner);
		this.document.body.appendChild(this.dragImage);
		// Astoundingly, we need to cover the dragger up: http://www.kryogenix.org/code/browser/custom-drag-image.html
		var bounds = this.dragImage.firstChild.getBoundingClientRect(),
			cover = this.document.createElement("div");
		cover.className = "tw-tiddler-dragger-cover";
		cover.style.left = (bounds.left - 16) + "px";
		cover.style.top = (bounds.top - 16) + "px";
		cover.style.width = (bounds.width + 32) + "px";
		cover.style.height = (bounds.height + 32) + "px";
		this.dragImage.appendChild(cover);
		// Set the data transfer properties
		var dataTransfer = event.dataTransfer;
		dataTransfer.effectAllowed = "copy";
		dataTransfer.setDragImage(this.dragImage.firstChild,-16,-16);
		dataTransfer.clearData();
		dataTransfer.setData("text/vnd.tiddler",this.wiki.getTiddlerAsJson(this.to));
		dataTransfer.setData("text/plain",this.wiki.getTiddlerText(this.to,""));
		event.stopPropagation();
	} else {
		event.preventDefault();
	}
};

LinkWidget.prototype.handleDragEndEvent = function(event) {
	// Remove the dragging class on the element being dragged
	$tw.utils.removeClass(event.target,"tw-tiddlylink-dragging");
	// Delete the drag image element
	if(this.dragImage) {
		this.dragImage.parentNode.removeChild(this.dragImage);
	}
};

/*
Compute the internal state of the widget
*/
LinkWidget.prototype.execute = function() {
	// Get the target tiddler title
	this.to = this.getAttribute("to",this.getVariable("currentTiddler"));
	// Determine the link characteristics
	this.isMissing = !this.wiki.tiddlerExists(this.to);
	this.isShadow = this.wiki.isShadowTiddler(this.to);
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
LinkWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.to || changedTiddlers[this.to]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Remove any DOM nodes created by this widget or its children
*/
LinkWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.link = LinkWidget;

})();
