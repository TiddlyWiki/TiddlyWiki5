/*\
title: $:/core/modules/widget/link.js
type: application/javascript
module-type: widget

Implements the link widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "link";

var isLinkExternal = function(to) {
	var externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(to);
};

exports.init = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generateChildNodes();
};

exports.generateChildNodes = function() {
	// Get the parameters from the attributes
	this.to = this.renderer.getAttribute("to");
	this.hover = this.renderer.getAttribute("hover");
	this.qualifyHoverTitle = this.renderer.getAttribute("qualifyHoverTitle");
	// Determine the default link characteristics
	this.isExternal = isLinkExternal(this.to);
	if(!this.isExternal) {
		this.isMissing = !this.renderer.renderTree.wiki.tiddlerExists(this.to);
	}
	// Compose the link
	var classes = ["tw-tiddlylink"]
	if(this.isExternal) {
		$tw.utils.pushTop(classes,"tw-tiddlylink-external");
	} else {
		$tw.utils.pushTop(classes,"tw-tiddlylink-internal");
		if(this.isMissing) {
			$tw.utils.pushTop(classes,"tw-tiddlylink-missing");
		} else {
			$tw.utils.pushTop(classes,"tw-tiddlylink-resolves");
		}
	}
	var events = [{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}];
	if(this.hover) {
		events.push({name: "mouseover", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
		events.push({name: "mouseout", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[{
		type: "element",
		tag: "a",
		attributes: {
			href: {type: "string", value: this.isExternal ? this.to : encodeURIComponent(this.to)},
			"class": {type: "string", value: classes.join(" ")}
		},
		children: this.renderer.parseTreeNode.children,
		events: events
	}]);
};

exports.handleClickEvent = function(event) {
	if(isLinkExternal(this.to)) {
		event.target.setAttribute("target","_blank");
		return true;
	} else {
		$tw.utils.dispatchCustomEvent(event.target,"tw-navigate",{
			navigateTo: this.to,
			navigateFromNode: this,
			navigateFromClientRect: this.children[0].domNode.getBoundingClientRect()
		});
		event.preventDefault();
		return false;
	}
};

exports.handleMouseOverOrOutEvent = function(event) {
	if(this.hover) {
		$tw.popup.triggerPopup({
			textRef: this.hover,
			domNode: this.children[0].domNode,
			qualifyTiddlerTitles: this.qualifyHoverTitle,
			contextTiddlerTitle: this.renderer.getContextTiddlerTitle(),
			wiki: this.renderer.renderTree.wiki
		});
	}
	event.preventDefault();
	return false;
};

exports.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Set the class for missing tiddlers
	if(this.targetTitle && changedTiddlers[this.targetTitle]) {
		$tw.utils.toggleClass(this.children[0].domNode,"tw-tiddler-missing",!this.renderer.renderTree.wiki.tiddlerExists(this.targetTitle));
	}
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.to || changedAttributes.hover || (this.to && changedTiddlers[this.to]) || (this.hover && changedTiddlers[this.hover])) {
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
