/*\
title: $:/core/modules/widgets/data.js
type: application/javascript
module-type: widget
\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataWidget = function(parseTreeNode,options) {
	this.dataWidgetTag = parseTreeNode.type;
	this.initialise(parseTreeNode,options);
};

DataWidget.prototype = new Widget();

DataWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.dataPayload = this.computeDataTiddlerValues(); // Array of $tw.Tiddler objects
	this.domNode = this.document.createTextNode(this.readDataTiddlerValuesAsJson());
	parent.insertBefore(this.domNode,nextSibling);
	this.domNodes.push(this.domNode);
};

DataWidget.prototype.execute = function() {
	// Nothing to do here
};

DataWidget.prototype.readDataTiddlerValues = function() {
	var results = [];
	$tw.utils.each(this.dataPayload,function(tiddler,index) {
		results.push(tiddler.getFieldStrings());
	});
	return results;
};

DataWidget.prototype.readDataTiddlerValuesAsJson = function() {
	return JSON.stringify(this.readDataTiddlerValues(),null,4);
};

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

	if(!this.hasAttribute("$tiddler") && !this.hasAttribute("$filter") && !this.hasAttribute("$compound-tiddler") && !this.hasAttribute("$compound-filter")) {
		if(Object.keys(item).length > 0 && !!item.title) {
			return [new $tw.Tiddler(item)];
		} else {
			return [];
		}
	} else {
		// Apply the item fields to each of the tiddlers
		if(Object.keys(item).length > 0) {
			$tw.utils.each(tiddlers,function(tiddler,index) {
				tiddlers[index] = new $tw.Tiddler(tiddler,item);
			});
		}
		return tiddlers;
	}
};

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
