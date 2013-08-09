/*\
title: $:/core/modules/widgets/fieldlist.js
type: application/javascript
module-type: widget

The fieldlist widget renders the fields of a tiddler through a template.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var FieldListWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

FieldListWidget.prototype.generate = function() {
	var self = this;
	// Get parameters from our attributes
	this.allTiddlers = this.renderer.hasAttribute("all");
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.tiddlerTitle);
	this.exclude = this.renderer.getAttribute("exclude");
	// Get the exclusion list
	this.excludeList;
	if(this.exclude) {
		this.excludeList = this.exclude.split(" ");
	} else {
		this.excludeList = ["text"]; 
	}
	// Get the list of fields
	var fieldList = this.getFieldList();
	// Set the element
	this.tag = "div";
	this.attributes = {
		"class": "tw-fieldlist"
	};
	// Set up the attributes for the wrapper element
	var classes = [];
	if(this.renderer.hasAttribute("class")) {
		$tw.utils.pushTop(classes,this.renderer.getAttribute("class").split(" "));
	}
	if(classes.length > 0) {
		this.attributes["class"] = classes.join(" ");
	}
	if(this.renderer.hasAttribute("style")) {
		this.attributes.style = this.renderer.getAttribute("style");
	}
	if(this.renderer.hasAttribute("tooltip")) {
		this.attributes.title = this.renderer.getAttribute("tooltip");
	}
	// Create the renderers for each list item
	var items = [];
	$tw.utils.each(fieldList,function(fieldName) {
		items.push(self.createListElement(fieldName));
	});
	this.children = this.renderer.renderTree.createRenderers(this.renderer,items);
};

FieldListWidget.prototype.createListElement = function(fieldName) {
	return {
		type: "element",
		tag: "$transclude",
		isBlock: true,
		attributes: {
			currentField: {type: "string", value: fieldName},
			target: {type: "string", value: this.tiddlerTitle}
		},
		children: this.renderer.parseTreeNode.children
	};
};

FieldListWidget.prototype.removeListElement = function(index) {
	// Get the list element
	var listElement = this.children[index];
	// Delete the DOM node
	listElement.domNode.parentNode.removeChild(listElement.domNode);
	// Then delete the actual renderer node
	this.children.splice(index,1);
};

FieldListWidget.prototype.getFieldList = function() {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		fieldList = [];
	// If requested, return all fields used on all tiddlers
	if(this.allTiddlers) {
		fieldList = this.renderer.renderTree.wiki.getAllTiddlerFields();
	} else if(tiddler) {
		// Return the fields on the specified tiddler
		for(var fieldName in tiddler.fields) {
			if(this.excludeList.indexOf(fieldName) === -1) {
				fieldList.push(fieldName);
			}
		}
	}
	fieldList.sort();
	return fieldList;
};

FieldListWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.tiddler || changedAttributes.exclude || changedAttributes.style || changedAttributes.tooltip || changedAttributes["class"]) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// Get the potentially updated list of fields
		var fieldList = this.getFieldList();
		// Walk through the fields
		for(var fieldIndex = 0; fieldIndex<fieldList.length; fieldIndex++) {
			// Look for the field in the rendered child nodes
			var targetIndex = this.findChildNode(fieldIndex,fieldList[fieldIndex]);
			if(targetIndex === -1) {
				// Insert the field if it wasn't present
				this.children.splice(fieldIndex,0,this.renderer.renderTree.createRenderer(this.renderer,this.createListElement(fieldList[fieldIndex])));
				this.renderer.domNode.insertBefore(this.children[fieldIndex].renderInDom(),this.renderer.domNode.childNodes[fieldIndex]);
			} else {
				// Delete any list elements preceding the one we want
				for(var n=targetIndex-1; n>=fieldIndex; n--) {
					this.removeListElement(n);
				}
				// Refresh the node we're reusing
				this.children[fieldIndex].refreshInDom(changedTiddlers);
			}
		}
		// Remove any left over elements
		for(fieldIndex = this.children.length-1; fieldIndex>=fieldList.length; fieldIndex--) {
			this.removeListElement(fieldIndex);
		}
	}
};

/*
Find the index of the child node representing the named field (or -1 if not present)
*/
FieldListWidget.prototype.findChildNode = function(startIndex,fieldName) {
	var index = startIndex;
	while(index < this.children.length) {
		if(this.children[index].attributes.currentField === fieldName) {
			return index;
		}
		index++;
	}
	return -1;
};

exports.fieldlist = FieldListWidget;

})();
