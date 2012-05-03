/*\
title: $:/core/modules/treenodes/text.js
type: application/javascript
module-type: treenode

Text nodes

\*/
(function(){

/*jshint node: true, browser: true */
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

Text.prototype.renderInDom = function(domNode) {
	this.domNode = document.createTextNode(this.text);
	domNode.appendChild(this.domNode);
};

exports.Text = Text;

})();
