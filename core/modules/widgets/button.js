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

exports.name = "button";

exports.init = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generateChildNodes();
};

exports.generateChildNodes = function() {
	// Get the parameters from the attributes
	this.message = this.renderer.getAttribute("message");
	this.param = this.renderer.getAttribute("param");
	this.set = this.renderer.getAttribute("set");
	this.setTo = this.renderer.getAttribute("setTo");
	this.popup = this.renderer.getAttribute("popup");
	this.hover = this.renderer.getAttribute("hover");
	this.qualifyTiddlerTitles = this.renderer.getAttribute("qualifyTiddlerTitles");
	this["class"] = this.renderer.getAttribute("class");
	// Compose the button
	var classes = ["tw-tiddlybutton"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	var events = [{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}];
	if(this.hover === "yes") {
		events.push({name: "mouseover", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
		events.push({name: "mouseout", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[{
		type: "element",
		tag: "button",
		attributes: {
			"class": {type: "string", value: classes.join(" ")}
		},
		children: this.renderer.parseTreeNode.children,
		events: events
	}]);
};

exports.dispatchMessage = function(event) {
	$tw.utils.dispatchCustomEvent(event.target,this.message,{
		param: this.param,
		tiddlerTitle: this.renderer.getContextTiddlerTitle()
	});
};

exports.triggerPopup = function(event) {
	var title = this.popup;
	if(this.qualifyTiddlerTitles) {
		title =  title + "-" + this.renderer.getContextScopeId();
	}
	$tw.popup.triggerPopup({
		domNode: this.renderer.domNode,
		title: title,
		wiki: this.renderer.renderTree.wiki
	});
};

exports.setTiddler = function() {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.set);
	this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: this.set, text: this.setTo}));
};

exports.handleClickEvent = function(event) {
	if(this.message) {
		this.dispatchMessage(event);
	}
	if(this.popup) {
		this.triggerPopup(event);
	}
	if(this.set && this.setTo) {
		this.setTiddler();
	}
	event.preventDefault();
	return false;
};

exports.handleMouseOverOrOutEvent = function(event) {
	if(this.popup) {
		this.triggerPopup(event);
	}
	event.preventDefault();
	return false;
};

exports.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
 	if(changedAttributes.message || changedAttributes.param || changedAttributes.set || changedAttributes.setTo || changedAttributes.popup || changedAttributes.hover || changedAttributes.qualifyTiddlerTitles || changedAttributes["class"] || (this.set && changedTiddlers[this.set]) || (this.popup && changedTiddlers[this.popup])) {
		// Remove old child nodes
		$tw.utils.removeChildren(this.parentElement);
		// Regenerate and render children
		this.generateChildNodes();
		var self = this;
		$tw.utils.each(this.children,function(node) {
			if(node.renderInDom) {
				self.parentElement.appendChild(node.renderInDom());
			}
		});
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

})();
