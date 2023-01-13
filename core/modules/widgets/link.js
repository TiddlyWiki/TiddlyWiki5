/*\
title: $:/core/modules/widgets/link.js
type: application/javascript
module-type: widget

Link widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

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
	// Get the value of the tv-wikilinks configuration macro
	var wikiLinksMacro = this.getVariable("tv-wikilinks"),
		useWikiLinks = wikiLinksMacro ? (wikiLinksMacro.trim() !== "no") : true,
		missingLinksEnabled = !(this.hideMissingLinks && this.isMissing && !this.isShadow);
	// Render the link if required
	if(useWikiLinks && missingLinksEnabled) {
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
	// Sanitise the specified tag
	var tag = this.linkTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "a";
	}
	// Create our element
	var namespace = this.getVariable("namespace",{defaultValue: "http://www.w3.org/1999/xhtml"}),
		domNode = this.document.createElementNS(namespace,tag);
	// Assign classes
	var classes = [];
	if(this.overrideClasses === undefined) {
		classes.push("tc-tiddlylink");
		if(this.isShadow) {
			classes.push("tc-tiddlylink-shadow");
		}
		if(this.isMissing && !this.isShadow) {
			classes.push("tc-tiddlylink-missing");
		} else {
			if(!this.isMissing) {
				classes.push("tc-tiddlylink-resolves");
			}
		}
		if(this.linkClasses) {
			classes.push(this.linkClasses);
		}
	} else if(this.overrideClasses !== "") {
		classes.push(this.overrideClasses)
	}
	if(classes.length > 0) {
		domNode.setAttribute("class",classes.join(" "));
	}
	// Set an href
	var wikilinkTransformFilter = this.getVariable("tv-filter-export-link"),
		wikiLinkText;
	if(wikilinkTransformFilter) {
		// Use the filter to construct the href
		wikiLinkText = this.wiki.filterTiddlers(wikilinkTransformFilter,this,function(iterator) {
			iterator(self.wiki.getTiddler(self.to),self.to)
		})[0];
	} else {
		// Expand the tv-wikilink-template variable to construct the href
		var wikiLinkTemplateMacro = this.getVariable("tv-wikilink-template"),
			wikiLinkTemplate = wikiLinkTemplateMacro ? wikiLinkTemplateMacro.trim() : "#$uri_encoded$";
		wikiLinkText = $tw.utils.replaceString(wikiLinkTemplate,"$uri_encoded$",encodeURIComponent(this.to));
		wikiLinkText = $tw.utils.replaceString(wikiLinkText,"$uri_doubleencoded$",encodeURIComponent(encodeURIComponent(this.to)));
	}
	// Override with the value of tv-get-export-link if defined
	wikiLinkText = this.getVariable("tv-get-export-link",{params: [{name: "to",value: this.to}],defaultValue: wikiLinkText});
	if(tag === "a") {
		var namespaceHref = (namespace === "http://www.w3.org/2000/svg") ? "http://www.w3.org/1999/xlink" : undefined;
		domNode.setAttributeNS(namespaceHref,"href",wikiLinkText);
	}
	// Set the tabindex
	if(this.tabIndex) {
		domNode.setAttribute("tabindex",this.tabIndex);
	}
	// Set the tooltip
	// HACK: Performance issues with re-parsing the tooltip prevent us defaulting the tooltip to "<$transclude field='tooltip'><$transclude field='title'/></$transclude>"
	var tooltipWikiText = this.tooltip || this.getVariable("tv-wikilink-tooltip");
	if(tooltipWikiText) {
		var tooltipText = this.wiki.renderText("text/plain","text/vnd.tiddlywiki",tooltipWikiText,{
				parseAsInline: true,
				variables: {
					currentTiddler: this.to
				},
				parentWidget: this
			});
		domNode.setAttribute("title",tooltipText);
	}
	if(this["aria-label"]) {
		domNode.setAttribute("aria-label",this["aria-label"]);
	}
	// Add a click event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"},
	]);
	// Make the link draggable if required
	if(this.draggable === "yes") {
		$tw.utils.makeDraggable({
			domNode: domNode,
			dragTiddlerFn: function() {return self.to;},
			widget: this
		});
	}
	// Insert the link into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

LinkWidget.prototype.handleClickEvent = function(event) {
	// Send the click on its way as a navigate event
	var bounds = this.domNodes[0].getBoundingClientRect();
	this.dispatchEvent({
		type: "tm-navigate",
		navigateTo: this.to,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: this,
		navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		},
		navigateFromClientTop: bounds.top,
		navigateFromClientLeft: bounds.left,
		navigateFromClientWidth: bounds.width,
		navigateFromClientRight: bounds.right,
		navigateFromClientBottom: bounds.bottom,
		navigateFromClientHeight: bounds.height,
		navigateSuppressNavigation: event.metaKey || event.ctrlKey || (event.button === 1),
		metaKey: event.metaKey,
		ctrlKey: event.ctrlKey,
		altKey: event.altKey,
		shiftKey: event.shiftKey,
		event: event
	});
	if(this.domNodes[0].hasAttribute("href")) {
		event.preventDefault();
	}
	event.stopPropagation();
	return false;
};

/*
Compute the internal state of the widget
*/
LinkWidget.prototype.execute = function() {
	// Pick up our attributes
	this.to = this.getAttribute("to",this.getVariable("currentTiddler"));
	this.tooltip = this.getAttribute("tooltip");
	this["aria-label"] = this.getAttribute("aria-label");
	this.linkClasses = this.getAttribute("class");
	this.overrideClasses = this.getAttribute("overrideClass");
	this.tabIndex = this.getAttribute("tabindex");
	this.draggable = this.getAttribute("draggable","yes");
	this.linkTag = this.getAttribute("tag","a");
	// Determine the link characteristics
	this.isMissing = !this.wiki.tiddlerExists(this.to);
	this.isShadow = this.wiki.isShadowTiddler(this.to);
	this.hideMissingLinks = (this.getVariable("tv-show-missing-links") || "yes") === "no";
	// Make the child widgets
	var templateTree;
	if(this.parseTreeNode.children && this.parseTreeNode.children.length > 0) {
		templateTree = this.parseTreeNode.children;
	} else {
		// Default template is a link to the title
		templateTree = [{type: "text", text: this.to}];
	}
	this.makeChildWidgets(templateTree);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
LinkWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.to || changedTiddlers[this.to] || changedAttributes["aria-label"] || changedAttributes.tooltip ||
		changedAttributes["class"] || changedAttributes.tabindex || changedAttributes.draggable || changedAttributes.tag) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.link = LinkWidget;

})();
