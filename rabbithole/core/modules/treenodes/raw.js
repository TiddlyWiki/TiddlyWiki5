/*\
title: $:/core/modules/treenodes/raw.js
type: application/javascript
module-type: treenode

Raw, unparsed HTML nodes

\*/
(function(){

/*jshint node: true, browser: true */
"use strict";

var Node = require("./node.js").Node;

var Raw = function(html) {
	if(this instanceof Raw) {
		this.html = html;
	} else {
		return new Raw(html);	
	}
};

Raw.prototype = new Node();
Raw.prototype.constructor = Raw;

Raw.prototype.render = function(type) {
	return this.html;
};

Raw.prototype.renderInDom = function(domNode) {
	this.domNode = document.createElement("div");
	this.domNode.innerHTML = this.html;
	domNode.appendChild(this.domNode);	
};

exports.Raw = Raw;

})();
