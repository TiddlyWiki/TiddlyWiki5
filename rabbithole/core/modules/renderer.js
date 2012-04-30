/*\
title: $:/core/renderer.js
type: application/javascript
module-type: global

Represents a parse tree and associated data

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = function(tree,dependencies) {
	this.tree = tree;
	this.dependencies = dependencies;
};

Renderer.prototype.execute = function(parents,tiddlerTitle) {
	for(var t=0; t<this.tree.length; t++) {
		this.tree[t].execute(parents,tiddlerTitle);
	}
};

Renderer.prototype.render = function(type) {
	var output = [];
	for(var t=0; t<this.tree.length; t++) {
		output.push(this.tree[t].render(type));
	}
	return output.join("");
};

Renderer.prototype.renderInDom = function(parentDomNode,insertBefore) {
	for(var t=0; t<this.tree.length; t++) {
		this.tree[t].renderInDom(parentDomNode,insertBefore);
	}
};

Renderer.prototype.refreshInDom = function(changes) {
	for(var t=0; t<this.tree.length; t++) {
		this.tree[t].refreshInDom(changes);
	}
};

exports.Renderer = Renderer;

})();
