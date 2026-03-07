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
		// Navigate to zoom path if set
		var zoomData = data;
		if(this.zoomPath) {
			zoomData = this.getDataAtPath(data,this.zoomPath);
			if(zoomData === undefined) {
				this.zoomPath = "";
				zoomData = data;
			}
		}
		// Show breadcrumb bar when zoomed in
		if(this.zoomPath) {
			container.appendChild(this.createBreadcrumb(data));
		}
		var tree = this.createTreeElement(zoomData,null,"");
		container.appendChild(tree);
		this.stateData = null;
		// Delegated event listeners on the container
		var self = this;
		container.addEventListener("toggle",function(event) {
			if(self._suppressToggleSave) {
				return;
			}
			var target = event.target;
			if(target.tagName === "DETAILS") {
				var keyToUpdate = target.getAttribute("data-state-key");
				if(keyToUpdate) {
					self.saveState(keyToUpdate,target.open);
				}
			}
		},true);
		container.addEventListener("click",function(event) {
			var summary = event.target;
			if(summary.tagName !== "SUMMARY") {
				summary = summary.closest ? summary.closest("summary") : null;
			}
			if(!summary || summary.tagName !== "SUMMARY") {
				return;
			}
			if(event.ctrlKey || event.metaKey) {
				var details = summary.parentNode;
				if(details && details.tagName === "DETAILS") {
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
			}
		});
	}
	parent.insertBefore(container,nextSibling);
	this.domNodes.push(container);
};

JsonTreeWidget.prototype.execute = function() {
	this.attTiddler = this.getAttribute("tiddler");
	this.attVariable = this.getAttribute("variable");
	this.attBlockList = this.getAttribute("block-list","");
	this.foldState = this.getAttribute("state","$:/temp/json-tree/state");
	this.blockList = {};
	if(this.attBlockList) {
		var blockParts = this.attBlockList.split(" ");
		for(var i = 0; i < blockParts.length; i++) {
			this.blockList[blockParts[i]] = true;
		}
	}
	if(this.zoomPath === undefined) {
		this.zoomPath = "";
	}
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
	var details = this.document.createElement("details");
	var stateKey = currentPath;
	var stateValue = Object.prototype.hasOwnProperty.call(this.stateData,stateKey) ? this.stateData[stateKey] : undefined;
	var defaultOpen = (key !== "orderedAttributes");
	details.open = (stateValue === undefined) ? defaultOpen : (stateValue !== "hide");
	details.setAttribute("data-state-key",stateKey);
	var summary = this.document.createElement("summary");
	if(key !== null) {
		summary.appendChild(this.createKeySpan(key));
	}
	var hintNode = this.document.createTextNode(this.getHint(data,isArray));
	summary.appendChild(hintNode);
	if(this.attVariable === "preview-text" && !isArray && typeof data.start === "number" && typeof data.end === "number") {
		summary.appendChild(this.createSelectRangeButton(data.start,data.end));
	}
	if(currentPath === "") {
		summary.appendChild(this.createExportButton());
	}
	if(currentPath !== "") {
		summary.appendChild(this.createZoomButton(currentPath));
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
			if(this.blockList[newKey]) {
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

JsonTreeWidget.prototype.getHint = function(data,isArray) {
	if(isArray) {
		return "[...] (" + data.length + " items)";
	} else if(typeof data.tag === "string") {
		return "{" + data.tag + " ...}";
	} else if(typeof data.type === "string") {
		return "{" + data.type + " ...}";
	}
	return "{...}";
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
	// Transclude the core link icon
	var iconWidget = this.makeChildWidget({
		type: "transclude",
		attributes: {
			"$tiddler": {type: "string", value: "$:/core/images/link"},
			"size": {type: "string", value: "10px"}
		}
	});
	iconWidget.render(button,null);
	button.addEventListener("click",function(event) {
		event.stopPropagation();
		event.preventDefault();
		if(self._activeButton) {
			self._activeButton.classList.remove("tc-jsontree-select-range-active");
			var prevSummary = self._activeButton.parentNode;
			if(prevSummary && prevSummary.tagName === "SUMMARY") {
				prevSummary.classList.remove("tc-jsontree-selected");
			}
		}
		button.classList.add("tc-jsontree-select-range-active");
		var parentSummary = button.parentNode;
		if(parentSummary && parentSummary.tagName === "SUMMARY") {
			parentSummary.classList.add("tc-jsontree-selected");
		}
		self._activeButton = button;
		if(event.ctrlKey || event.metaKey) {
			self.focusPath(button);
		}
		self.selectEditorRange(start,end);
	});
	return button;
};

JsonTreeWidget.prototype.createExportButton = function() {
	var self = this;
	var button = this.document.createElement("button");
	button.className = "tc-jsontree-select-range tc-btn-invisible";
	button.setAttribute("title","Export visible tree to tiddler");
	var iconWidget = this.makeChildWidget({
		type: "transclude",
		attributes: {
			"$tiddler": {type: "string", value: "$:/core/images/import-button"},
			"size": {type: "string", value: "10px"}
		}
	});
	iconWidget.render(button,null);
	button.addEventListener("click",function(event) {
		event.stopPropagation();
		event.preventDefault();
		var container = self.domNodes[0];
		if(!container) {
			return;
		}
		var fullData = self.getData();
		if(typeof fullData === "string") {
			return;
		}
		var data = self.zoomPath ? self.getDataAtPath(fullData,self.zoomPath) : fullData;
		if(data === undefined) {
			return;
		}
		var rootDetails = container.querySelector("details");
		var text = "";
		if(self.zoomPath) {
			text = self.exportBreadcrumbText() + "\n\n";
		}
		text += self.exportTreeText(data,rootDetails,"");
		self.wiki.addTiddler(new $tw.Tiddler(
			self.wiki.getCreationFields(),
			{
				title: "jsontree-limited-view",
				type: "text/plain",
				text: text
			},
			self.wiki.getModificationFields()));
	});
	return button;
};

JsonTreeWidget.prototype.exportTreeText = function(data,detailsElement,indent) {
	var OPEN = "\u2B9F";
	var CLOSED = "\u2B9E";
	var lines = [];
	if(Array.isArray(data)) {
		var hint = this.getHint(data,true);
		if(!detailsElement || !detailsElement.open) {
			return CLOSED + " " + hint;
		}
		lines.push(OPEN + " " + hint);
		var valueDiv = detailsElement.querySelector(":scope > .tc-jsontree-value");
		var items = valueDiv ? valueDiv.children : [];
		var childIndent = indent + "\t";
		for(var i = 0; i < data.length; i++) {
			var itemDiv = items[i];
			var childDetail = itemDiv ? itemDiv.querySelector(":scope > details") : null;
			var value = data[i];
			if(typeof value === "object" && value !== null) {
				lines.push(childIndent + this.exportTreeText(value,childDetail,childIndent));
			} else {
				lines.push(childIndent + this.formatValue(value));
			}
		}
	} else if(typeof data === "object" && data !== null) {
		var hint = this.getHint(data,false);
		if(!detailsElement || !detailsElement.open) {
			return CLOSED + " " + hint;
		}
		lines.push(OPEN + " " + hint);
		var keys = Object.keys(data);
		var valueDiv = detailsElement.querySelector(":scope > .tc-jsontree-value");
		var items = valueDiv ? valueDiv.children : [];
		var childIndent = indent + "\t";
		var visibleIndex = 0;
		for(var k = 0; k < keys.length; k++) {
			var key = keys[k];
			if(this.blockList[key]) {
				continue;
			}
			var itemDiv = items[visibleIndex];
			visibleIndex++;
			var childDetail = itemDiv ? itemDiv.querySelector(":scope > details") : null;
			var value = data[key];
			if(typeof value === "object" && value !== null) {
				var nestedIndent = childIndent + "\t";
				lines.push(nestedIndent + "\"" + key + "\": " + this.exportTreeText(value,childDetail,nestedIndent));
			} else {
				lines.push(childIndent + "\"" + key + "\": " + this.formatValue(value));
			}
		}
	} else {
		return this.formatValue(data);
	}
	return lines.join("\n");
};

JsonTreeWidget.prototype.exportBreadcrumbText = function() {
	var parts = this.zoomPath.split("/");
	var segments = ["\u2302"];
	var lines = [];
	var currentLine = segments[0];
	for(var i = 0; i < parts.length; i++) {
		var addition = " / " + parts[i];
		if(currentLine.length + addition.length > 120 && currentLine.length > 0) {
			lines.push(currentLine);
			currentLine = "  " + parts[i];
		} else {
			currentLine += addition;
		}
	}
	if(currentLine) {
		lines.push(currentLine);
	}
	return lines.join("\n");
};

JsonTreeWidget.prototype.formatValue = function(value) {
	if(value === null) {
		return "null";
	}
	if(typeof value === "string") {
		return "\"" + value + "\"";
	}
	return String(value);
};

JsonTreeWidget.prototype.createZoomButton = function(currentPath) {
	var self = this;
	var button = this.document.createElement("button");
	button.className = "tc-jsontree-select-range tc-btn-invisible";
	button.setAttribute("title","Zoom into this node");
	var iconWidget = this.makeChildWidget({
		type: "transclude",
		attributes: {
			"$tiddler": {type: "string", value: "$:/core/images/preview-open"},
			"size": {type: "string", value: "10px"}
		}
	});
	iconWidget.render(button,null);
	button.addEventListener("click",function(event) {
		event.stopPropagation();
		event.preventDefault();
		self.zoomPath = self.zoomPath ? self.zoomPath + "/" + currentPath : currentPath;
		self.refreshSelf();
	});
	return button;
};

JsonTreeWidget.prototype.getDataAtPath = function(data,path) {
	if(!path) {
		return data;
	}
	var parts = path.split("/");
	var current = data;
	for(var i = 0; i < parts.length; i++) {
		if(current === null || typeof current !== "object") {
			return undefined;
		}
		var key = parts[i];
		if(Array.isArray(current)) {
			key = parseInt(key,10);
		}
		current = current[key];
	}
	return current;
};

JsonTreeWidget.prototype.findFirstAttributes = function(data) {
	if(!data || typeof data !== "object") {
		return null;
	}
	if(!Array.isArray(data) && data.attributes && typeof data.attributes === "object" && !Array.isArray(data.attributes) && Object.keys(data.attributes).length > 0) {
		return data.attributes;
	}
	if(Array.isArray(data)) {
		for(var i = 0; i < data.length; i++) {
			var found = this.findFirstAttributes(data[i]);
			if(found) {
				return found;
			}
		}
	} else {
		var keys = Object.keys(data);
		for(var i = 0; i < keys.length; i++) {
			var found = this.findFirstAttributes(data[keys[i]]);
			if(found) {
				return found;
			}
		}
	}
	return null;
};

JsonTreeWidget.prototype.getAttributesTooltip = function(data) {
	var attrs = this.findFirstAttributes(data);
	if(!attrs) {
		return "";
	}
	var lines = [];
	var keys = Object.keys(attrs);
	for(var i = 0; i < keys.length; i++) {
		var attr = attrs[keys[i]];
		if(attr && typeof attr === "object" && typeof attr.value === "string") {
			lines.push(keys[i] + "=\"" + attr.value + "\"");
		} else {
			lines.push(keys[i] + "=" + JSON.stringify(attr));
		}
	}
	return lines.length ? lines.join("\n") : "";
};

JsonTreeWidget.prototype.createBreadcrumb = function(fullData) {
	var self = this;
	var bar = this.document.createElement("div");
	bar.className = "tc-jsontree-breadcrumb";
	// Root link
	var rootLink = this.document.createElement("button");
	rootLink.className = "tc-btn-invisible tc-jsontree-breadcrumb-item";
	rootLink.appendChild(this.document.createTextNode("\u2302"));
	rootLink.setAttribute("title","Back to root");
	rootLink.addEventListener("click",function() {
		self.zoomPath = "";
		self.refreshSelf();
	});
	bar.appendChild(rootLink);
	// Path segments
	var parts = this.zoomPath.split("/");
	var accumulated = "";
	var segData = fullData;
	for(var i = 0; i < parts.length; i++) {
		bar.appendChild(this.document.createTextNode(" / "));
		accumulated = accumulated ? accumulated + "/" + parts[i] : parts[i];
		segData = (segData && typeof segData === "object") ? segData[Array.isArray(segData) ? parseInt(parts[i],10) : parts[i]] : undefined;
		var tooltip = this.getAttributesTooltip(segData);
		if(i < parts.length - 1) {
			var segLink = this.document.createElement("button");
			segLink.className = "tc-btn-invisible tc-jsontree-breadcrumb-item";
			segLink.appendChild(this.document.createTextNode(parts[i]));
			if(tooltip) {
				segLink.setAttribute("title",tooltip);
			}
			(function(path) {
				segLink.addEventListener("click",function() {
					self.zoomPath = path;
					self.refreshSelf();
				});
			})(accumulated);
			bar.appendChild(segLink);
		} else {
			var segSpan = this.document.createElement("span");
			segSpan.appendChild(this.document.createTextNode(parts[i]));
			if(tooltip) {
				segSpan.setAttribute("title",tooltip);
			}
			bar.appendChild(segSpan);
		}
	}
	return bar;
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
