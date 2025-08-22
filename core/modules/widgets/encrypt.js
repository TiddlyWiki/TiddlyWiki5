/*\
title: $:/core/modules/widgets/encrypt.js
type: application/javascript
module-type: widget

Encrypt widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class EncryptWidget extends Widget {
	constructor(parseTreeNode, options) {
		super();
		this.initialise(parseTreeNode, options);
	}
	/*
	Render this widget into the DOM
	*/
	render(parent, nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();
		var textNode = this.document.createTextNode(this.encryptedText);
		parent.insertBefore(textNode, nextSibling);
		this.domNodes.push(textNode);
	}
	/*
	Compute the internal state of the widget
	*/
	execute() {
		// Get parameters from our attributes
		this.filter = this.getAttribute("filter", "[!is[system]]");
		// Encrypt the filtered tiddlers
		var tiddlers = this.wiki.filterTiddlers(this.filter), json = {}, self = this;
		$tw.utils.each(tiddlers, function (title) {
			var tiddler = self.wiki.getTiddler(title), jsonTiddler = {};
			for (var f in tiddler.fields) {
				jsonTiddler[f] = tiddler.getFieldString(f);
			}
			json[title] = jsonTiddler;
		});
		this.encryptedText = $tw.utils.htmlEncode($tw.crypto.encrypt(JSON.stringify(json)));
	}
	/*
	Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
	*/
	refresh(changedTiddlers) {
		// We don't need to worry about refreshing because the encrypt widget isn't for interactive use
		return false;
	}
}

exports.encrypt = EncryptWidget;
