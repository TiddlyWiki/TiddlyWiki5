/*\
title: $:/core/modules/widgets/data.js
type: application/javascript
module-type: widget

Widget to dynamically represent one or more tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataWidget = function(parseTreeNode,options) {
	this.dataWidgetTag = parseTreeNode.type;
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DataWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var jsonPayload = JSON.stringify(this.readDataTiddlerValues(),null,4);
	var textNode = this.document.createTextNode(jsonPayload);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
DataWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Read the tiddler value(s) from a data widget – must be called after the .render() method
*/
DataWidget.prototype.readDataTiddlerValues = function() {
	var self = this;
	// Start with a blank object
	var item = Object.create(null);
	// Read any attributes not prefixed with $
	$tw.utils.each(this.attributes,function(value,name) {
		if(name.charAt(0) !== "$") {
			item[name] = value;	
		}
	});
	item = new $tw.Tiddler(item);
	// Deal with $tiddler, $filter or $compound-tiddler attributes
	var tiddlers = [],title;
	if(this.hasAttribute("$tiddler")) {
		title = this.getAttribute("$tiddler");
		if(title) {
			var tiddler = this.wiki.getTiddler(title);
			if(tiddler) {
				tiddlers.push(tiddler);
			}
		}
	}
	if(this.hasAttribute("$filter")) {
		var filter = this.getAttribute("$filter");
		if(filter) {
			var titles = this.wiki.filterTiddlers(filter);
			$tw.utils.each(titles,function(title) {
				var tiddler = self.wiki.getTiddler(title);
				tiddlers.push(tiddler);
			});
		}
	}
	if(this.hasAttribute("$compound-tiddler")) {
		title = this.getAttribute("$compound-tiddler");
		if(title) {
			tiddlers.push.apply(tiddlers,this.extractCompoundTiddler(title));
		}
	}
	// Convert the literal item to field strings
	item = item.getFieldStrings();
	if(tiddlers.length === 0) {
		if(Object.keys(item).length > 0 && !!item.title) {
			return [item];
		} else {
			return [];
		}
	} else {
		var results = [];
		$tw.utils.each(tiddlers,function(tiddler,index) {
			var fields = tiddler.getFieldStrings();
			results.push($tw.utils.extend({},fields,item));
		});
		return results;	
	}
};

/*
Helper to extract tiddlers from text/vnd.tiddlywiki-multiple tiddlers
*/
DataWidget.prototype.extractCompoundTiddler = function(title) {
	var tiddler = this.wiki.getTiddler(title);
	if(tiddler && tiddler.fields.type === "text/vnd.tiddlywiki-multiple") {
		var text = tiddler.fields.text || "",
			rawTiddlers = text.split(/\r?\n\+\r?\n/),
			tiddlers = [];
		$tw.utils.each(rawTiddlers,function(rawTiddler) {
			var fields = Object.create(null),
				split = rawTiddler.split(/\r?\n\r?\n/mg);
			if(split.length >= 1) {
				fields = $tw.utils.parseFields(split[0],fields);
			}
			if(split.length >= 2) {
				fields.text = split.slice(1).join("\n\n");
			}
			tiddlers.push(new $tw.Tiddler(fields));
		});
		return tiddlers;
	} else {
		return [];
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DataWidget.prototype.refresh = function(changedTiddlers) {
	// It would be expensive to calculate whether the changedTiddlers impact the filter
	// identified by the $filter attribute so we just refresh ourselves unconditionally
	this.refreshSelf();
	return true;
};

exports.data = DataWidget;

})();
