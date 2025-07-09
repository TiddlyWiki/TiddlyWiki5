/*\
title: $:/plugins/tiddlywiki/railroad/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `railroad-diagrams.js` that provides a `<$railroad>` widget.

\*/

"use strict";

const Parser = require("$:/plugins/tiddlywiki/railroad/parser.js").parser;
const Widget = require("$:/core/modules/widgets/widget.js").widget;

const RailroadWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

const RAILROAD_OPTIONS = "$:/config/railroad";

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
	const source = this.getAttribute("text",this.parseTreeNode.text || "");
	// Create a div to contain the SVG or error message
	const div = this.document.createElement("div");
	try {
		// Initialise options from the config tiddler or widget attributes
		const config = this.wiki.getTiddlerData(RAILROAD_OPTIONS,{});
		const options = {
			arrow: this.getAttribute("arrow",config.arrow || "yes") === "yes",
			debug: this.getAttribute("debug",config.debug || "no") === "yes",
			start: this.getAttribute("start",config.start || "single"),
			end: this.getAttribute("end",config.end || "single")
		};
		// Parse the source
		const parser = new Parser(this,source,options);
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
	const output = ["<pre>"];
	parser.root.debug(output,"");
	output.push("</pre>");
	div.innerHTML = output.join("");
};

RailroadWidget.prototype.renderSvg = function(parser,div) {
	// Generate a model of the diagram
	const fakeSvg = parser.root.toSvg(parser.options);
	// Render the model into a tree of SVG DOM nodes
	const svg = fakeSvg.toSVG();
	// Fill in the remaining attributes of any link nodes
	this.patchLinks(svg);
	// Insert the SVG tree into the div
	div.appendChild(svg);
};

RailroadWidget.prototype.patchLinks = function(node) {
	const self = this;
	if(!$tw.node && node.hasChildNodes()) {
		const children = node.childNodes;
		for(let i = 0;i < children.length;i++) {
			var child = children[i];
			const {attributes} = child;
			if(attributes) {
				// Find each element that has a data-tw-target attribute
				let target = child.attributes["data-tw-target"];
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
							};
						})(target);
						target = `#${target}`;
					}
					child.setAttributeNS("http://www.w3.org/1999/xlink","href",target);
				}
			}
			this.patchLinks(child);
		}
	}
};

RailroadWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes();
	if(changedAttributes.text || changedTiddlers[RAILROAD_OPTIONS]) {
		this.refreshSelf();
		return true;
	}
	return false;
};

RailroadWidget.prototype.dispatchLink = function(to,event) {
	// Send the click on its way as a navigate event
	const bounds = this.domNodes[0].getBoundingClientRect();
	this.dispatchEvent({
		type: "tm-navigate",
		navigateTo: to,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: this,
		navigateFromClientRect: {
			top: bounds.top,left: bounds.left,width: bounds.width,right: bounds.right,bottom: bounds.bottom,height: bounds.height
		},
		navigateSuppressNavigation: event.metaKey || event.ctrlKey || (event.button === 1)
	});
	event.preventDefault();
	event.stopPropagation();
	return false;
};

exports.railroad = RailroadWidget;
