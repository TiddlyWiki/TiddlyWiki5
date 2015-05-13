/*\
title: $:/core/modules/widgets/parse-tree.js
type: application/javascript
module-type: widget

Experimental widget to render a parse tree

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ParseTreeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ParseTreeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ParseTreeWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our element
	var domNode = this.document.createElement("div");
	domNode.className = "tc-parse-tree";
	this.renderParseTree(domNode,this.parseTree.tree);
	// Insert the element into the DOM
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

/*
Render the tree
*/
ParseTreeWidget.prototype.renderParseTree = function(parent,parseTree) {
	var self = this,
		ol = this.document.createElement("ol");
	$tw.utils.each(parseTree,function(parseTreeNode,index) {
		var li = self.document.createElement("li");
		self.renderParseTreeNode(li,parseTreeNode);
		if(parseTreeNode.children && parseTreeNode.children.length > 0) {
			self.renderParseTree(li,parseTreeNode.children);
		}
		ol.appendChild(li);
	});
	parent.appendChild(ol);
};

/*
Render a tree node
*/
ParseTreeWidget.prototype.renderParseTreeNode = function(parent,parseTreeNode) {
	switch(parseTreeNode.type) {
		case "element":
			parent.appendChild(this.document.createTextNode("<" + parseTreeNode.tag + ">"));
			break;
		case "text":
			var text = parseTreeNode.text || parseTreeNode.attributes.text || "";
			this.renderText(parent,text);
			break;
		default:
			parent.appendChild(this.document.createTextNode("<$" + parseTreeNode.type + ">"));
			break;
	}
};

/*
Render a text string
*/
ParseTreeWidget.prototype.renderText = function(parent,text) {
	var textWrapper = this.document.createElement("span");
	textWrapper.className = "tc-parse-tree-text";
	var runs = text.split("\n");
	$tw.utils.each(runs,function(text,index) {
		if(text !== "") {
			textWrapper.appendChild(self.document.createTextNode(text));
		}
		if(index < runs.length - 1) {
			var newline = self.document.createElement("span");
			newline.className = "tc-parse-tree-newline";
			newline.appendChild(self.document.createTextNode($tw.utils.entityDecode("&#8617;")));
			textWrapper.appendChild(newline);
			textWrapper.appendChild(self.document.createElement("br"));
		}
	});
	parent.appendChild(textWrapper);
};

/*
Compute the internal state of the widget
*/
ParseTreeWidget.prototype.execute = function() {
	// Get our parameters
	this.parseTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.parseField = this.getAttribute("field","text");
	this.parseIndex = this.getAttribute("index");
	// Get the current parse tree
	var options = {};
	this.parseTree = this.wiki.parseTextReference(this.parseTitle,this.parseField,this.parseIndex,options);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ParseTreeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedTiddlers[this.parseTitle]) {
		this.refreshSelf();
		return true;
	}
	return false;
};

exports["parse-tree"] = ParseTreeWidget;

})();
