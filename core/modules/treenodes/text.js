/*\
title: $:/core/modules/treenodes/text.js
type: application/javascript
module-type: treenode

Text nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Node = require("./node.js").Node;

var Text = function(text) {
	if(this instanceof Text) {
		this.text = text;
	} else {
		return new Text(text);
	}
};

Text.prototype = new Node();
Text.prototype.constructor = Text;

Text.prototype.render = function(type) {
	return type === "text/html" ? $tw.utils.htmlEncode(this.text) : this.text;
};

Text.prototype.renderInDom = function(parentDomNode,insertBefore) {
	this.domNode = document.createTextNode(this.text);
	if(insertBefore) {
		parentDomNode.insertBefore(this.domNode,insertBefore);
	} else {
		parentDomNode.appendChild(this.domNode);
	}
};

exports.Text = Text;

})();
