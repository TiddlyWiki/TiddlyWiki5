/*\
title: $:/core/modules/widgets/encrypt.js
type: application/javascript
module-type: widget

Implements the encrypt widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var EncryptWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

EncryptWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.filter = this.renderer.getAttribute("filter");
	// Check whether we've got an encryption password
	var isEncrypted = $tw.crypto.hasPassword();
	// Encrypt the filtered tiddlers
	var tiddlers = this.renderer.renderTree.wiki.filterTiddlers(this.filter),
		json = {},
		self = this;
	$tw.utils.each(tiddlers,function(title) {
		var tiddler = self.renderer.renderTree.wiki.getTiddler(title),
			jsonTiddler = {};
		for(var f in tiddler.fields) {
			jsonTiddler[f] = tiddler.getFieldString(f);
		}
		json[title] = jsonTiddler;
	});
	var encryptedText = $tw.utils.htmlEncode($tw.crypto.encrypt(JSON.stringify(json)));
	// Set the return element
	this.tag = "pre";
	this.attributes ={"class": "tw-encrypt"};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
		type: "text",
		text: encryptedText
	}]);
};

exports.encrypt = EncryptWidget;

})();
