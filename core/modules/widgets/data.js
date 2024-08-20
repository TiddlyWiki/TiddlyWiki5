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
	this.dataPayload = this.computeDataTiddlerValues(); // Array of $tw.Tiddler objects
	this.domNode = this.document.createTextNode(this.readDataTiddlerValuesAsJson());
	parent.insertBefore(this.domNode,nextSibling);
	this.domNodes.push(this.domNode);
};

/*
Compute the internal state of the widget
*/
DataWidget.prototype.execute = function() {
	// Nothing to do here
};

/*
Read the tiddler value(s) from a data widget as an array of tiddler field objects (not $tw.Tiddler objects)
*/
DataWidget.prototype.readDataTiddlerValues = function() {
	var results = [];
	$tw.utils.each(this.dataPayload,function(tiddler,index) {
		results.push(tiddler.getFieldStrings());
	});
	return results;
};

/*
Read the tiddler value(s) from a data widget as an array of tiddler field objects (not $tw.Tiddler objects)
*/
DataWidget.prototype.readDataTiddlerValuesAsJson = function() {
	return JSON.stringify(this.readDataTiddlerValues(),null,4);
};

/*
Compute list of tiddlers from a data widget
*/
DataWidget.prototype.computeDataTiddlerValues = function() {
	var self = this;
	// Read any attributes not prefixed with $
	var item = Object.create(null);
	$tw.utils.each(this.attributes,function(value,name) {
		if(name.charAt(0) !== "$") {
			item[name] = value;	
		}
	});
	// Deal with $tiddler, $filter or $compound-tiddler attributes
	var tiddlers = [],
		compoundTiddlers,
		title;
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
				if(tiddler) {
					tiddlers.push(tiddler);
				}
			});
		}
	}
	if(this.hasAttribute("$compound-tiddler")) {
		title = this.getAttribute("$compound-tiddler");
		if(title) {
			tiddlers.push.apply(tiddlers,this.extractCompoundTiddler(title));
		}
	}
	if(this.hasAttribute("$compound-filter")) {
		filter = this.getAttribute("$compound-filter");
		if(filter) {
			compoundTiddlers = this.wiki.filterTiddlers(filter);
			$tw.utils.each(compoundTiddlers, function(title){
				tiddlers.push.apply(tiddlers,self.extractCompoundTiddler(title));
			});
		}
	}
	// Return the literal item if none of the special attributes were used
	if(!this.hasAttribute("$tiddler") && !this.hasAttribute("$filter") && !this.hasAttribute("$compound-tiddler") && !this.hasAttribute("$compound-filter")) {
		if(Object.keys(item).length > 0 && !!item.title) {
			return [new $tw.Tiddler(item)];
		} else {
			return [];
		}
	} else {
		// Apply the item fields to each of the tiddlers
		delete item.title; // Do not overwrite the title
		if(Object.keys(item).length > 0) {
			$tw.utils.each(tiddlers,function(tiddler,index) {
				tiddlers[index] = new $tw.Tiddler(tiddler,item);
			});
		}
		return tiddlers;
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
	var changedAttributes = this.computeAttributes();
	var newPayload = this.computeDataTiddlerValues();
	if(hasPayloadChanged(this.dataPayload,newPayload)) {
		this.dataPayload = newPayload;
		this.domNode.textContent = this.readDataTiddlerValuesAsJson();
		return true;
	} else {
		return false;
	}
};

/*
Compare two arrays of tiddlers and return true if they are different
*/
function hasPayloadChanged(a,b) {
	if(a.length === b.length) {
		for(var t=0; t<a.length; t++) {
			if(!(a[t].isEqual(b[t]))) {
				return true;
			}
		}
		return false;
	} else {
		return true;
	}
}

exports.data = DataWidget;

})();
