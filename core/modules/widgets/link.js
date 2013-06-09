/*\
title: $:/core/modules/widgets/link.js
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
	this.to = this.renderer.getAttribute("to",this.renderer.tiddlerTitle);
	this.hover = this.renderer.getAttribute("hover");
	this.qualifyHoverTitles = this.renderer.getAttribute("qualifyHoverTitles");
	// Qualify the hover tiddler title if needed
	if(this.qualifyHoverTitles) {
		this.hover =  this.hover + "-" + this.renderer.renderTree.getContextScopeId(this.renderer.parentRenderer);
	}
	// Determine the default link characteristics
	this.isExternal = isLinkExternal(this.to);
	if(!this.isExternal) {
		this.isMissing = !this.renderer.renderTree.wiki.tiddlerExists(this.to);
		this.isShadow = this.renderer.renderTree.wiki.isShadowTiddler(this.to);
	}
	// Compose the link
	var classes = ["tw-tiddlylink"]
	if(this.isExternal) {
		$tw.utils.pushTop(classes,"tw-tiddlylink-external");
	} else {
		$tw.utils.pushTop(classes,"tw-tiddlylink-internal");
		if(this.isShadow) {
			$tw.utils.pushTop(classes,"tw-tiddlylink-shadow");
		}
		if(this.isMissing && !this.isShadow) {
			$tw.utils.pushTop(classes,"tw-tiddlylink-missing");
		} else {
			if(!this.isMissing) {
				$tw.utils.pushTop(classes,"tw-tiddlylink-resolves");
			}
		}
	}
	var events = [
		{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"},
		{name: "dragstart", handlerObject: this, handlerMethod: "handleDragStartEvent"},
		{name: "dragend", handlerObject: this, handlerMethod: "handleDragEndEvent"}
	];
	if(this.hover) {
		events.push({name: "mouseover", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
		events.push({name: "mouseout", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
	}
	// Get the value of the tw-wikilinks configuration macro
	var wikiLinksMacro = this.renderer.renderTree.findMacroDefinition(this.renderer.parentRenderer,"tw-wikilinks"),
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
			var wikiLinkTemplateMacro = this.renderer.renderTree.findMacroDefinition(this.renderer.parentRenderer,"tw-wikilink-template"),
				wikiLinkTemplate = wikiLinkTemplateMacro ? wikiLinkTemplateMacro.text.trim() : "$uri_encoded$";
			this.wikiLinkText = wikiLinkTemplate.replace("$uri_encoded$",encodeURIComponent(this.to));
			this.wikiLinkText = this.wikiLinkText.replace("$uri_doubleencoded$",encodeURIComponent(encodeURIComponent(this.to)));
			this.attributes.href = this.wikiLinkText;
		}
		this.events = events;
	} else {
		this.tag = "span";
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
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
		event.stopPropagation();
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

LinkWidget.prototype.handleDragStartEvent = function(event) {
	if(this.to) {
		// Set the dragging class on the element being dragged
		$tw.utils.addClass(event.target,"tw-tiddlylink-dragging");
		// Create the drag image element
		this.dragImage = this.renderer.renderTree.document.createElement("div");
		this.dragImage.className = "tw-tiddler-dragger";
		this.dragImage.appendChild(this.renderer.renderTree.document.createTextNode(this.to));
		this.renderer.renderTree.document.body.appendChild(this.dragImage);
		// Set the data transfer properties
		var dataTransfer = event.dataTransfer;
		dataTransfer.effectAllowed = "copy";
		dataTransfer.setDragImage(this.dragImage,-16,-16);
		dataTransfer.clearData();
		dataTransfer.setData("text/vnd.tiddler",this.renderer.renderTree.wiki.getTiddlerAsJson(this.to));
		dataTransfer.setData("text/plain",this.renderer.renderTree.wiki.getTiddlerText(this.to,""));
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

LinkWidget.prototype.postRenderInDom = function() {
	// Add the draggable attribute to links (we don't include it in the static HTML representation)
	if(this.renderer.domNode.tagName === "A") {
		this.renderer.domNode.setAttribute("draggable",true);
	}
	// Hack the href of internal links to include a #, again omitted from the static representation. This helps the browser see it as an internal link (eg it prevents Mobile Safari on iPhone from sliding the address bar into view)
	if(!this.isExternal) {
		this.renderer.domNode.setAttribute("href","#" + this.wikiLinkText);
	}
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
