/*\
title: $:/core/modules/new_widgets/encrypt.js
type: application/javascript
module-type: new_widget

Encrypt widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var EncryptWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EncryptWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EncryptWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.encryptedText);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
EncryptWidget.prototype.execute = function() {
	// Get parameters from our attributes
	this.filter = this.getAttribute("filter","[!is[system]]");
	// Encrypt the filtered tiddlers
	var tiddlers = this.wiki.filterTiddlers(this.filter),
		json = {},
		self = this;
	$tw.utils.each(tiddlers,function(title) {
		var tiddler = self.wiki.getTiddler(title),
			jsonTiddler = {};
		for(var f in tiddler.fields) {
			jsonTiddler[f] = tiddler.getFieldString(f);
		}
		json[title] = jsonTiddler;
	});
	this.encryptedText = $tw.utils.htmlEncode($tw.crypto.encrypt(JSON.stringify(json)));
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EncryptWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		affectedTiddlers = this.wiki.filterTiddlers(this.filter,null,changedTiddlers);
	if(changedAttributes.filter || affectedTiddlers.length > 0) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

/*
Remove any DOM nodes created by this widget
*/
EncryptWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.encrypt = EncryptWidget;

})();
