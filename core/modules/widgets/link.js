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

var isLinkExternal = function(to) {
	var externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(to);
};

var LinkWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

LinkWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.to = this.renderer.getAttribute("to");
	this.hover = this.renderer.getAttribute("hover");
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
	// Get the value of the tw-wikilinks configuration macro
	var wikiLinksMacro = this.renderer.findMacroDefinition("tw-wikilinks"),
		useWikiLinks = wikiLinksMacro ? !(wikiLinksMacro.text.trim() === "no") : true;
	// Set up the element
	if(useWikiLinks) {
		this.tag = "a";
		this.attributes = {
			"class": classes.join(" ")
		};
		if(this.isExternal) {
			this.attributes.href = this.to;
		} else {
			var wikiLinkTemplateMacro = this.renderer.findMacroDefinition("tw-wikilink-template"),
				wikiLinkTemplate = wikiLinkTemplateMacro ? wikiLinkTemplateMacro.text.trim() : "$uri_encoded$",
				wikiLinkText = wikiLinkTemplate.replace("$uri_encoded$",encodeURIComponent(this.to));
			this.attributes.href = wikiLinkText;
		}
	} else {
		this.tag = "span";
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,this.renderer.parseTreeNode.children);
	this.events = events;
};

LinkWidget.prototype.handleClickEvent = function(event) {
	if(isLinkExternal(this.to)) {
		event.target.setAttribute("target","_blank");
		return true;
	} else {
		$tw.utils.dispatchCustomEvent(event.target,"tw-navigate",{
			navigateTo: this.to,
			navigateFromNode: this,
			navigateFromClientRect: this.renderer.domNode.getBoundingClientRect()
		});
		event.preventDefault();
		return false;
	}
};

LinkWidget.prototype.handleMouseOverOrOutEvent = function(event) {
	if(this.hover) {
		$tw.popup.triggerPopup({
			title: this.hover,
			domNode: this.renderer.domNode,
			wiki: this.renderer.renderTree.wiki
		});
	}
	event.preventDefault();
	return false;
};

LinkWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Set the class for missing tiddlers
	if(this.targetTitle && changedTiddlers[this.targetTitle]) {
		$tw.utils.toggleClass(this.renderer.domNode,"tw-tiddler-missing",!this.renderer.renderTree.wiki.tiddlerExists(this.targetTitle));
	}
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.to || changedAttributes.hover || (this.to && changedTiddlers[this.to]) || (this.hover && changedTiddlers[this.hover])) {
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

exports.link = LinkWidget;

})();
