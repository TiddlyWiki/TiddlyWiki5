/*\
title: $:/plugins/wikilabs/debug/jsontree-widget.js
type: application/javascript
module-type: widget

A widget to render JSON data as an interactive collapsible tree.

Attributes:
	tiddler - title of a tiddler containing JSON text
	variable - name of a variable containing JSON text
	block-list - space-separated list of keys to hide
	state - tiddler title for storing expansion state (default: $:/temp/json-tree/state)

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var JsonTreeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

JsonTreeWidget.prototype = new Widget();

JsonTreeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create container
	var container = this.document.createElement("div");
	container.className = "tc-json-tree";
	// Get JSON data
	var data = this.getData();
	if(typeof data === "string") {
		// Error message
		container.appendChild(this.document.createTextNode(data));
	} else {
		this.stateData = this.wiki.getTiddlerDataCached(this.attState,{});
		var tree = this.createTreeElement(data,null,"");
		container.appendChild(tree);
		this.stateData = null;
	}
	parent.insertBefore(container,nextSibling);
	this.domNodes.push(container);
};

JsonTreeWidget.prototype.execute = function() {
	this.attTiddler = this.getAttribute("tiddler");
	this.attVariable = this.getAttribute("variable");
	this.attBlockList = this.getAttribute("block-list","");
	this.attState = this.getAttribute("state","$:/temp/json-tree/state");
	this.blockList = this.attBlockList ? this.attBlockList.split(" ") : [];
};

JsonTreeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["tiddler"] || changedAttributes["variable"] || changedAttributes["block-list"] || changedAttributes["state"]) {
		this.refreshSelf();
		return true;
	}
	if(this.attTiddler && changedTiddlers[this.attTiddler]) {
		this.refreshSelf();
		return true;
	}
	// If using a variable, we need to check if it changed
	if(this.attVariable) {
		var currentValue = this.getVariable(this.attVariable);
		if(currentValue !== this.cachedVariableValue) {
			this.refreshSelf();
			return true;
		}
	}
	return false;
};

JsonTreeWidget.prototype.getData = function() {
	var jsonText;
	if(this.attVariable) {
		jsonText = this.getVariable(this.attVariable);
		if(!jsonText) {
			return "Variable \"" + this.attVariable + "\" is empty or undefined";
		}
	} else if(this.attTiddler) {
		var tiddler = this.wiki.getTiddler(this.attTiddler);
		if(!tiddler) {
			return "Source tiddler not found: " + this.attTiddler;
		}
		jsonText = tiddler.fields.text;
	} else {
		return "No tiddler or variable attribute specified";
	}
	// Cache variable value for refresh comparison
	if(this.attVariable) {
		this.cachedVariableValue = jsonText;
	}
	try {
		return JSON.parse(jsonText);
	} catch(e) {
		return "Invalid JSON: " + e.message;
	}
};

JsonTreeWidget.prototype.createTreeElement = function(data,key,currentPath) {
	if(Array.isArray(data)) {
		return this.createCollapsibleElement(data,key,currentPath,true);
	} else if(typeof data === "object" && data !== null) {
		return this.createCollapsibleElement(data,key,currentPath,false);
	}
	var span = this.document.createElement("span");
	if(key !== null) {
		span.appendChild(this.createKeySpan(key));
	}
	span.appendChild(this.createValueElement(data));
	return span;
};

JsonTreeWidget.prototype.createCollapsibleElement = function(data,key,currentPath,isArray) {
	var self = this;
	var details = this.document.createElement("details");
	var stateKey = currentPath;
	var stateValue = this.stateData[stateKey];
	details.open = (stateValue === undefined) ? true : (stateValue !== "hide");
	details.setAttribute("data-state-key",stateKey);
	details.addEventListener("toggle",function(event) {
		var keyToUpdate = event.target.getAttribute("data-state-key");
		if(keyToUpdate) {
			self.saveState(keyToUpdate,event.target.open);
		}
	});
	var summary = this.document.createElement("summary");
	if(key !== null) {
		summary.appendChild(this.createKeySpan(key));
	}
	if(isArray) {
		summary.appendChild(this.document.createTextNode("[...] (" + data.length + " items)"));
	} else {
		summary.appendChild(this.document.createTextNode("{...}"));
	}
	if(!isArray && typeof data.start === "number" && typeof data.end === "number") {
		summary.appendChild(this.createSelectRangeButton(data.start,data.end));
	}
	details.appendChild(summary);
	var list = this.document.createElement("div");
	list.className = "tc-json-tree-value";
	if(isArray) {
		for(var i = 0; i < data.length; i++) {
			var item = this.document.createElement("div");
			var newPath = currentPath ? currentPath + "/" + i : String(i);
			item.appendChild(this.createTreeElement(data[i],i,newPath));
			list.appendChild(item);
		}
	} else {
		var keys = Object.keys(data);
		for(var k = 0; k < keys.length; k++) {
			var newKey = keys[k];
			if(this.blockList.indexOf(newKey) !== -1) {
				continue;
			}
			var objItem = this.document.createElement("div");
			var objPath = currentPath ? currentPath + "/" + newKey : newKey;
			objItem.appendChild(this.createTreeElement(data[newKey],newKey,objPath));
			list.appendChild(objItem);
		}
	}
	details.appendChild(list);
	return details;
};

JsonTreeWidget.prototype.createKeySpan = function(key) {
	var span = this.document.createElement("span");
	span.className = "tc-json-tree-key";
	span.appendChild(this.document.createTextNode(
		(typeof key === "number") ? key + ": " : "\"" + key + "\": "
	));
	return span;
};

JsonTreeWidget.prototype.createValueElement = function(value) {
	var span = this.document.createElement("span");
	if(value === null) {
		span.className = "tc-json-tree-null";
		span.appendChild(this.document.createTextNode("null"));
	} else {
		var type = typeof value;
		span.className = "tc-json-tree-" + type;
		span.appendChild(this.document.createTextNode(
			(type === "string") ? "\"" + value + "\"" : String(value)
		));
	}
	return span;
};

JsonTreeWidget.prototype.createSelectRangeButton = function(start,end) {
	var self = this;
	var button = this.document.createElement("button");
	button.className = "tc-json-tree-select-range tc-btn-invisible";
	button.setAttribute("title","Select source text (" + start + "-" + end + ")");
	var wrapper = this.document.createElement("span");
	wrapper.innerHTML = "<svg class='tc-image-link tc-image-button' viewBox='0 0 128 128'><g fill-rule='evenodd'><path d='M42.263 69.38a31.919 31.919 0 006.841 10.13c12.5 12.5 32.758 12.496 45.255 0l22.627-22.628c12.502-12.501 12.497-32.758 0-45.255-12.5-12.5-32.758-12.496-45.254 0L49.104 34.255a32.333 32.333 0 00-2.666 3.019 36.156 36.156 0 0121.94.334l14.663-14.663c6.25-6.25 16.382-6.254 22.632-.004 6.248 6.249 6.254 16.373-.004 22.631l-22.62 22.62c-6.25 6.25-16.381 6.254-22.631.004a15.93 15.93 0 01-4.428-8.433 11.948 11.948 0 00-7.59 3.48l-6.137 6.137z'/><path d='M86.35 59.234a31.919 31.919 0 00-6.84-10.13c-12.5-12.5-32.758-12.497-45.255 0L11.627 71.732c-12.501 12.5-12.496 32.758 0 45.254 12.5 12.5 32.758 12.497 45.255 0L79.51 94.36a32.333 32.333 0 002.665-3.02 36.156 36.156 0 01-21.94-.333l-14.663 14.663c-6.25 6.25-16.381 6.253-22.63.004-6.25-6.249-6.255-16.374.003-22.632l22.62-22.62c6.25-6.25 16.381-6.253 22.631-.003a15.93 15.93 0 014.428 8.432 11.948 11.948 0 007.59-3.48l6.137-6.136z'/></g></svg>";
	button.appendChild(wrapper.firstChild);
	button.addEventListener("click",function(event) {
		event.stopPropagation();
		event.preventDefault();
		self.selectEditorRange(start,end);
	});
	return button;
};

JsonTreeWidget.prototype.selectEditorRange = function(start,end) {
	// Find the editor container by walking up from our DOM node
	var container = this.domNodes[0];
	while(container && !container.classList.contains("tc-tiddler-editor")) {
		container = container.parentNode;
	}
	if(!container) {
		return;
	}
	// Look for the editor iframe (framed engine) or textarea (simple engine)
	var iframe = container.querySelector("iframe.tc-edit-texteditor-body");
	if(iframe) {
		var textarea = iframe.contentWindow && iframe.contentWindow.document.querySelector("textarea,input");
		if(textarea) {
			textarea.focus();
			textarea.setSelectionRange(start,end);
		}
		return;
	}
	// Simple engine: direct textarea
	var textarea = container.querySelector("textarea.tc-edit-texteditor-body,input.tc-edit-texteditor-body");
	if(textarea) {
		textarea.focus();
		textarea.setSelectionRange(start,end);
	}
};

JsonTreeWidget.prototype.saveState = function(stateKey,isOpen) {
	var currentData = $tw.utils.extend({},this.wiki.getTiddlerDataCached(this.attState,{}));
	if(isOpen) {
		delete currentData[stateKey];
	} else {
		currentData[stateKey] = "hide";
	}
	this.wiki.addTiddler(new $tw.Tiddler({
		title: this.attState,
		type: "application/json",
		text: JSON.stringify(currentData,null,2)
	}));
};

exports.jsontree = JsonTreeWidget;
