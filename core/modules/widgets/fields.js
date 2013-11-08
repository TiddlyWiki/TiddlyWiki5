/*\
title: $:/core/modules/widgets/fields.js
type: application/javascript
module-type: widget

Fields widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FieldsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
FieldsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
FieldsWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
FieldsWidget.prototype.execute = function() {
	// Get parameters from our attributes
	this.tiddlerTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.template = this.getAttribute("template");
	this.exclude = this.getAttribute("exclude");
	this.stripTitlePrefix = this.getAttribute("stripTitlePrefix","no") === "yes";
	// Get the value to display
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle);
	// Get the exclusion list
	var exclude;
	if(this.exclude) {
		exclude = this.exclude.split(" ");
	} else {
		exclude = ["text"]; 
	}
	// Compose the template
	var text = [];
	if(this.template && tiddler) {
		var fields = [];
		for(var fieldName in tiddler.fields) {
			if(exclude.indexOf(fieldName) === -1) {
				fields.push(fieldName);
			}
		}
		fields.sort();
		for(var f=0; f<fields.length; f++) {
			fieldName = fields[f];
			if(exclude.indexOf(fieldName) === -1) {
				var row = this.template,
					value = tiddler.getFieldString(fieldName);
				if(this.stripTitlePrefix && fieldName === "title") {
					var reStrip = /^\{[^\}]+\}(.+)/mg,
						reMatch = reStrip.exec(value);
					if(reMatch) {
						value = reMatch[1];
					}
				}
				row = row.replace("$name$",fieldName);
				row = row.replace("$value$",value);
				row = row.replace("$encoded_value$",$tw.utils.htmlEncode(value));
				text.push(row)
			}
		}
	}
	this.text = text.join("");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
FieldsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.template || changedAttributes.exclude || changedAttributes.stripTitlePrefix || changedTiddlers[this.tiddlerTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

/*
Remove any DOM nodes created by this widget
*/
FieldsWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.fields = FieldsWidget;

})();
