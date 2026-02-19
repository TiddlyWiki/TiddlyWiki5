/*\
title: $:/core/modules/widgets/browse.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var BrowseWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

BrowseWidget.prototype = new Widget();

BrowseWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("input");
	domNode.setAttribute("type","file");
	if(this.browseMultiple) {
		domNode.setAttribute("multiple","multiple");
	}
	if(this.tooltip) {
		domNode.setAttribute("title",this.tooltip);
	}
	if(this.tabIndex) {
		domNode.setAttribute("tabindex", this.tabIndex);
	}

	if(this.nwsaveas) {
		domNode.setAttribute("nwsaveas",this.nwsaveas);
	}
	if(this.accept) {
		domNode.setAttribute("accept",this.accept);
	}

	if(this.webkitdirectory) {
		domNode.setAttribute("webkitdirectory",this.webkitdirectory);
	}
	if(this.nwdirectory) {
		domNode.setAttribute("nwdirectory",this.nwdirectory);
	}
	if(this.isDisabled === "yes") {
		domNode.setAttribute("disabled", true);
	}

	domNode.addEventListener("change",function (event) {
		if(self.message) {
			self.dispatchEvent({type: self.message, param: self.param, files: event.target.files});
		} else {
			self.wiki.readFiles(event.target.files,{
				callback: function(tiddlerFieldsArray) {
					self.dispatchEvent({type: "tm-import-tiddlers", param: JSON.stringify(tiddlerFieldsArray)});
				},
				deserializer: self.deserializer
			});
		}
		return false;
	},false);
	// Assign data- attributes
	this.assignAttributes(domNode,{
		sourcePrefix: "data-",
		destPrefix: "data-"
	});
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	this.renderChildren(domNode,null);
};

BrowseWidget.prototype.execute = function() {
	this.browseMultiple = this.getAttribute("multiple");
	this.deserializer = this.getAttribute("deserializer");
	this.message = this.getAttribute("message");
	this.param = this.getAttribute("param");
	this.tooltip = this.getAttribute("tooltip");
	this.nwsaveas = this.getAttribute("nwsaveas");
	this.accept = this.getAttribute("accept");
	this.webkitdirectory = this.getAttribute("webkitdirectory");
	this.nwdirectory = this.getAttribute("nwdirectory");
	this.tabIndex = this.getAttribute("tabindex");
	this.isDisabled = this.getAttribute("disabled", "no");
};

BrowseWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return false;
};

exports.browse = BrowseWidget;
