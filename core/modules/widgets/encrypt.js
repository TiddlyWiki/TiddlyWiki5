/*\
title: $:/core/modules/widgets/encrypt.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EncryptWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

EncryptWidget.prototype = new Widget();

EncryptWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.encryptedText);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

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

EncryptWidget.prototype.refresh = function(changedTiddlers) {
	// We don't need to worry about refreshing because the encrypt widget isn't for interactive use
	return false;
};

exports.encrypt = EncryptWidget;
