/*\
title: $:/core/modules/widget/button.js
type: application/javascript
module-type: widget

Implements the button widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ButtonWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

ButtonWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.message = this.renderer.getAttribute("message");
	this.param = this.renderer.getAttribute("param");
	this.set = this.renderer.getAttribute("set");
	this.setTo = this.renderer.getAttribute("setTo");
	this.popup = this.renderer.getAttribute("popup");
	this.hover = this.renderer.getAttribute("hover");
	this.qualifyTiddlerTitles = this.renderer.getAttribute("qualifyTiddlerTitles");
	this["class"] = this.renderer.getAttribute("class");
	this.selectedClass = this.renderer.getAttribute("selectedClass");
	// Compose the button
	var classes = ["tw-button"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	var events = [{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}];
	if(this.hover === "yes") {
		events.push({name: "mouseover", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
		events.push({name: "mouseout", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
	}
	if(this.set && this.setTo && this.selectedClass) {
		if(this.isSelected()) {
			classes.push(this.selectedClass);
		}
	}
	// Set the return element
	this.tag = "button";
	this.attributes ={"class": classes.join(" ")};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
	this.events = events;
};

ButtonWidget.prototype.dispatchMessage = function(event) {
	$tw.utils.dispatchCustomEvent(event.target,this.message,{
		param: this.param,
		tiddlerTitle: this.renderer.tiddlerTitle
	});
};

ButtonWidget.prototype.triggerPopup = function(event) {
	var title = this.popup;
	if(this.qualifyTiddlerTitles) {
		title =  title + "-" + this.renderer.renderTree.getContextScopeId(this.renderer.parentRenderer);
	}
	$tw.popup.triggerPopup({
		domNode: this.renderer.domNode,
		title: title,
		wiki: this.renderer.renderTree.wiki
	});
};

ButtonWidget.prototype.isSelected = function() {
	var title = this.set;
	if(this.qualifyTiddlerTitles) {
		title =  title + "-" + this.renderer.renderTree.getContextScopeId(this.renderer.parentRenderer);
	}
	var tiddler = this.renderer.renderTree.wiki.getTiddler(title);
	return tiddler ? tiddler.fields.text === this.setTo : false;
};

ButtonWidget.prototype.setTiddler = function() {
	var title = this.set;
	if(this.qualifyTiddlerTitles) {
		title =  title + "-" + this.renderer.renderTree.getContextScopeId(this.renderer.parentRenderer);
	}
	var tiddler = this.renderer.renderTree.wiki.getTiddler(title);
	this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: title, text: this.setTo}));
};

ButtonWidget.prototype.handleClickEvent = function(event) {
	var handled = false;
	if(this.message) {
		this.dispatchMessage(event);
		handled = true;
	}
	if(this.popup) {
		this.triggerPopup(event);
		handled = true;
	}
	if(this.set && this.setTo) {
		this.setTiddler();
		handled = true;
	}
	event.stopPropagation();
	event.preventDefault();
	return handled;
};

ButtonWidget.prototype.handleMouseOverOrOutEvent = function(event) {
	if(this.popup) {
		this.triggerPopup(event);
	}
	event.preventDefault();
	return false;
};

ButtonWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	var setTitle = this.set,
		popupTitle = this.popup;
	if(this.qualifyTiddlerTitles) {
		var scopeId = this.renderer.renderTree.getContextScopeId(this.renderer.parentRenderer);
		if(setTitle) {
			setTitle =  setTitle + "-" + scopeId;
		}
		if(popupTitle) {
			popupTitle =  popupTitle + "-" + scopeId;
		}
	}
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
 	if(changedAttributes.message || changedAttributes.param || changedAttributes.set || changedAttributes.setTo || changedAttributes.popup || changedAttributes.hover || changedAttributes.qualifyTiddlerTitles || changedAttributes["class"] || (setTitle && changedTiddlers[setTitle]) || (popupTitle && changedTiddlers[popupTitle])) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

exports.button = ButtonWidget;

})();
