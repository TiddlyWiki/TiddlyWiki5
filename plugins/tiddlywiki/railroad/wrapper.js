/*\
title: $:/plugins/tiddlywiki/railroad/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `railroad-diagrams.js` that provides a `<$railroad>` widget.

\*/

"use strict";

var Parser = require("$:/plugins/tiddlywiki/railroad/parser.js").parser,
	Widget = require("$:/core/modules/widgets/widget.js").widget;

var RailroadWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

var RAILROAD_OPTIONS = "$:/config/railroad";

/*
Inherit from the base widget class
*/
RailroadWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RailroadWidget.prototype.render = function(parent,nextSibling) {
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Get the source text
	var source = this.getAttribute("text",this.parseTreeNode.text || "");
	// Create a div to contain the SVG or error message
	var div = this.document.createElement("div");
	try {
		// Initialise options from the config tiddler or widget attributes
		var config = this.wiki.getTiddlerData(RAILROAD_OPTIONS,{});
		var options = {
			arrow: this.getAttribute("arrow", config.arrow || "yes") === "yes",
			debug: this.getAttribute("debug", config.debug || "no") === "yes",
			start: this.getAttribute("start", config.start || "single"),
			end: this.getAttribute("end", config.end || "single")
		};
		// Parse the source
		var parser = new Parser(this,source,options);
		// Generate content into the div
		if(parser.options.debug) {
			this.renderDebug(parser,div);
		} else {
			this.renderSvg(parser,div);
		}
	} catch(ex) {
		div.className = "tc-error";
		div.textContent = ex;
	}
	// Insert the div into the DOM
	parent.insertBefore(div,nextSibling);
	this.domNodes.push(div);
};

RailroadWidget.prototype.renderDebug = function(parser,div) {
	var output = ["<pre>"];
	parser.root.debug(output, "");
	output.push("</pre>");
	div.innerHTML = output.join("");
};

RailroadWidget.prototype.renderSvg = function(parser,div) {
	// Generate a model of the diagram
	var fakeSvg = parser.root.toSvg(parser.options);
	// Render the model into a tree of SVG DOM nodes
	var svg = fakeSvg.toSVG();
	// Fill in the remaining attributes of any link nodes
	this.patchLinks(svg);
	// Insert the SVG tree into the div
	div.appendChild(svg);
};

RailroadWidget.prototype.patchLinks = function(node) {
	var self = this;
	if(!$tw.node && node.hasChildNodes()) {
		var children = node.childNodes;
		for(var i=0; i<children.length; i++) {
			var child = children[i];
			var attributes = child.attributes;
			if(attributes) {
				// Find each element that has a data-tw-target attribute
				var target = child.attributes["data-tw-target"];
				if(target !== undefined) {
					target = target.value;
					if(child.attributes["data-tw-external"]) {
						// External links are straightforward
						child.setAttribute("target","_blank");
						child.setAttribute("rel","noopener noreferrer");
					} else {
						// Each internal link gets its own onclick handler, capturing its own copy of target
						(function(myTarget) {
							child.onclick = function(event) {
								self.dispatchLink(myTarget,event);
								return false;
							}
						})(target);
						target = "#" + target;
					}
					child.setAttributeNS("http://www.w3.org/1999/xlink","href",target);
				}
			}
			this.patchLinks(child);
		}
	}
};

RailroadWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text || changedTiddlers[RAILROAD_OPTIONS]) {
		this.refreshSelf();
		return true;
	}
	return false;	
};

RailroadWidget.prototype.dispatchLink = function(to,event) {
	// Send the click on its way as a navigate event
	var bounds = this.domNodes[0].getBoundingClientRect();
	this.dispatchEvent({
		type: "tm-navigate",
		navigateTo: to,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: this,
		navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		},
		navigateSuppressNavigation: event.metaKey || event.ctrlKey || (event.button === 1)
	});
	event.preventDefault();
	event.stopPropagation();
	return false;
};

exports.railroad = RailroadWidget;
