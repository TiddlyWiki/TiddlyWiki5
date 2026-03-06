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
	container.className = "tc-jsontree";
	// Get JSON data
	var data = this.getData();
	if(typeof data === "string") {
		// Error message
		container.appendChild(this.document.createTextNode(data));
	} else {
		this.stateData = this.wiki.getTiddlerDataCached(this.foldState,{});
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
	this.foldState = this.getAttribute("state","$:/temp/json-tree/state");
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
	var stateValue = Object.prototype.hasOwnProperty.call(this.stateData,stateKey) ? this.stateData[stateKey] : undefined;
	details.open = (stateValue === undefined) ? true : (stateValue !== "hide");
	details.setAttribute("data-state-key",stateKey);
	details.addEventListener("toggle",function(event) {
		if(self._suppressToggleSave) {
			return;
		}
		var keyToUpdate = event.target.getAttribute("data-state-key");
		if(keyToUpdate) {
			self.saveState(keyToUpdate,event.target.open);
		}
	});
	var summary = this.document.createElement("summary");
	summary.addEventListener("click",function(event) {
		if(event.ctrlKey || event.metaKey) {
			// After browser toggles the parent, match all children
			setTimeout(function() {
				var isOpen = details.open;
				var childDetails = details.querySelectorAll("details");
				self._suppressToggleSave = true;
				for(var i = 0; i < childDetails.length; i++) {
					childDetails[i].open = isOpen;
				}
				self._suppressToggleSave = false;
				self.batchSaveState();
			},0);
		}
	});
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
	list.className = "tc-jsontree-value";
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
	span.className = "tc-jsontree-key";
	span.appendChild(this.document.createTextNode(
		(typeof key === "number") ? key + ": " : "\"" + key + "\": "
	));
	return span;
};

JsonTreeWidget.prototype.createValueElement = function(value) {
	var span = this.document.createElement("span");
	if(value === null) {
		span.className = "tc-jsontree-null";
		span.appendChild(this.document.createTextNode("null"));
	} else {
		var type = typeof value;
		span.className = "tc-jsontree-" + type;
		span.appendChild(this.document.createTextNode(
			(type === "string") ? "\"" + value + "\"" : String(value)
		));
	}
	return span;
};

JsonTreeWidget.prototype.createSelectRangeButton = function(start,end) {
	var self = this;
	var button = this.document.createElement("button");
	button.className = "tc-jsontree-select-range tc-btn-invisible";
	button.setAttribute("title","Select source text (" + start + "-" + end + ")");
	var SVG_NS = "http://www.w3.org/2000/svg";
	var svg = this.document.createElementNS(SVG_NS,"svg");
	svg.setAttribute("class","tc-image-link tc-image-button");
	svg.setAttribute("viewBox","0 0 128 128");
	var g = this.document.createElementNS(SVG_NS,"g");
	g.setAttribute("fill-rule","evenodd");
	var path1 = this.document.createElementNS(SVG_NS,"path");
	path1.setAttribute("d","M42.263 69.38a31.919 31.919 0 006.841 10.13c12.5 12.5 32.758 12.496 45.255 0l22.627-22.628c12.502-12.501 12.497-32.758 0-45.255-12.5-12.5-32.758-12.496-45.254 0L49.104 34.255a32.333 32.333 0 00-2.666 3.019 36.156 36.156 0 0121.94.334l14.663-14.663c6.25-6.25 16.382-6.254 22.632-.004 6.248 6.249 6.254 16.373-.004 22.631l-22.62 22.62c-6.25 6.25-16.381 6.254-22.631.004a15.93 15.93 0 01-4.428-8.433 11.948 11.948 0 00-7.59 3.48l-6.137 6.137z");
	var path2 = this.document.createElementNS(SVG_NS,"path");
	path2.setAttribute("d","M86.35 59.234a31.919 31.919 0 00-6.84-10.13c-12.5-12.5-32.758-12.497-45.255 0L11.627 71.732c-12.501 12.5-12.496 32.758 0 45.254 12.5 12.5 32.758 12.497 45.255 0L79.51 94.36a32.333 32.333 0 002.665-3.02 36.156 36.156 0 01-21.94-.333l-14.663 14.663c-6.25 6.25-16.381 6.253-22.63.004-6.25-6.249-6.255-16.374.003-22.632l22.62-22.62c6.25-6.25 16.381-6.253 22.631-.003a15.93 15.93 0 014.428 8.432 11.948 11.948 0 007.59-3.48l6.137-6.136z");
	g.appendChild(path1);
	g.appendChild(path2);
	svg.appendChild(g);
	button.appendChild(svg);
	button.addEventListener("click",function(event) {
		event.stopPropagation();
		event.preventDefault();
		if(self._activeButton) {
			self._activeButton.classList.remove("tc-jsontree-select-range-active");
		}
		button.classList.add("tc-jsontree-select-range-active");
		self._activeButton = button;
		if(event.ctrlKey || event.metaKey) {
			self.focusPath(button);
		}
		self.selectEditorRange(start,end);
	});
	return button;
};

JsonTreeWidget.prototype.focusPath = function(buttonElement) {
	var container = this.domNodes[0];
	if(!container) {
		return;
	}
	var allDetails = container.querySelectorAll("details[data-state-key]");
	// Find ancestor <details> elements of the clicked button — these stay open
	var keepOpen = Object.create(null);
	var node = buttonElement;
	while(node && node !== container) {
		if(node.nodeName.toLowerCase() === "details") {
			var ancestorKey = node.getAttribute("data-state-key");
			if(ancestorKey !== null) {
				keepOpen[ancestorKey] = true;
			}
		}
		node = node.parentNode;
	}
	// If we have a saved state, restore it (toggle back)
	var savedTiddler = this.wiki.getTiddler(this.foldState + "/saved");
	if(savedTiddler) {
		var saved = this.wiki.getTiddlerDataCached(this.foldState + "/saved",{});
		this.wiki.deleteTiddler(this.foldState + "/saved");
		this._suppressToggleSave = true;
		for(var i = 0; i < allDetails.length; i++) {
			var key = allDetails[i].getAttribute("data-state-key");
			if(key !== null) {
				allDetails[i].open = (saved[key] !== "hide");
			}
		}
		this._suppressToggleSave = false;
		this.wiki.addTiddler(new $tw.Tiddler({
			title: this.foldState,
			type: "application/json",
			text: JSON.stringify(saved,null,2)
		}));
		return;
	}
	// Save current fold state from DOM before focusing
	var savedState = {};
	for(var i = 0; i < allDetails.length; i++) {
		var key = allDetails[i].getAttribute("data-state-key");
		if(key !== null && !allDetails[i].open) {
			savedState[key] = "hide";
		}
	}
	this.wiki.addTiddler(new $tw.Tiddler({
		title: this.foldState + "/saved",
		type: "application/json",
		text: JSON.stringify(savedState,null,2)
	}));
	// Close all except ancestors of the clicked button
	var newState = {};
	this._suppressToggleSave = true;
	for(var i = 0; i < allDetails.length; i++) {
		var key = allDetails[i].getAttribute("data-state-key");
		if(key !== null) {
			if(keepOpen[key]) {
				allDetails[i].open = true;
			} else {
				allDetails[i].open = false;
				newState[key] = "hide";
			}
		}
	}
	this._suppressToggleSave = false;
	this.wiki.addTiddler(new $tw.Tiddler({
		title: this.foldState,
		type: "application/json",
		text: JSON.stringify(newState,null,2)
	}));
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

JsonTreeWidget.prototype.batchSaveState = function() {
	var container = this.domNodes[0];
	if(!container) {
		return;
	}
	var allDetails = container.querySelectorAll("details[data-state-key]");
	var stateData = {};
	for(var i = 0; i < allDetails.length; i++) {
		var key = allDetails[i].getAttribute("data-state-key");
		if(key !== null && !allDetails[i].open) {
			stateData[key] = "hide";
		}
	}
	this.wiki.addTiddler(new $tw.Tiddler({
		title: this.foldState,
		type: "application/json",
		text: JSON.stringify(stateData,null,2)
	}));
};

JsonTreeWidget.prototype.saveState = function(stateKey,isOpen) {
	var currentData = $tw.utils.extend({},this.wiki.getTiddlerDataCached(this.foldState,{}));
	if(isOpen) {
		delete currentData[stateKey];
	} else {
		currentData[stateKey] = "hide";
	}
	this.wiki.addTiddler(new $tw.Tiddler({
		title: this.foldState,
		type: "application/json",
		text: JSON.stringify(currentData,null,2)
	}));
};

exports.jsontree = JsonTreeWidget;
