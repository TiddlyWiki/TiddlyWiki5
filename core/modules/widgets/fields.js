/*\
title: $:/core/modules/widgets/fields.js
type: application/javascript
module-type: widget

Fields widget

\*/

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
	this.sort = this.getAttribute("sort","yes") === "yes";
	this.sortReverse = this.getAttribute("sortReverse","no") === "yes";
	this.exclude = this.getAttribute("exclude");
	this.include = this.getAttribute("include",null);
	this.stripTitlePrefix = this.getAttribute("stripTitlePrefix","no") === "yes";
	// Get the value to display
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle);

	// Get the inclusion and exclusion list
	var excludeArr = (this.exclude) ? this.exclude.split(" ") : ["text"];
	// Include takes precedence
	var includeArr = (this.include) ? this.include.split(" ") : null;

	// Compose the template
	var text = [];
	if(this.template && tiddler) {
		var fields = [];
		if (includeArr) { // Include takes precedence
			for(var i=0; i<includeArr.length; i++) {
				if(tiddler.fields[includeArr[i]]) {
					fields.push(includeArr[i]);
				}
			}
		} else {
			for(var fieldName in tiddler.fields) {
				if(excludeArr.indexOf(fieldName) === -1) {
					fields.push(fieldName);
				}
			}
		}
		if (this.sort) fields.sort();
		if (this.sortReverse) fields.reverse();
		for(var f=0, fmax=fields.length; f<fmax; f++) {
			fieldName = fields[f];
			var row = this.template,
				value = tiddler.getFieldString(fieldName);
			if(this.stripTitlePrefix && fieldName === "title") {
				var reStrip = /^\{[^\}]+\}(.+)/mg,
					reMatch = reStrip.exec(value);
				if(reMatch) {
					value = reMatch[1];
				}
			}
			row = $tw.utils.replaceString(row,"$name$",fieldName);
			row = $tw.utils.replaceString(row,"$value$",value);
			row = $tw.utils.replaceString(row,"$encoded_value$",$tw.utils.htmlEncode(value));
			text.push(row);
		}
	}
	this.text = text.join("");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
FieldsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if( changedAttributes.tiddler || changedAttributes.template || changedAttributes.exclude ||
		changedAttributes.include || changedAttributes.sort || changedAttributes.sortReverse ||
		changedTiddlers[this.tiddlerTitle] || changedAttributes.stripTitlePrefix) {
			this.refreshSelf();
			return true;
	} else {
		return false;
	}
};

exports.fields = FieldsWidget;
