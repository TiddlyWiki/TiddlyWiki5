/*\
title: $:/core/modules/treenodes/entity.js
type: application/javascript
module-type: treenode

Entity nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Node = require("./node.js").Node;

var Entity = function(entity) {
	if(this instanceof Entity) {
		this.entity = entity;
	} else {
		return new Entity(entity);	
	}
};

Entity.prototype = new Node();
Entity.prototype.constructor = Entity;

Entity.prototype.render = function(type) {
	return type === "text/html" ? this.entity : $tw.utils.entityDecode(this.entity);
};

Entity.prototype.renderInDom = function(domNode) {
	this.domNode = document.createTextNode($tw.utils.entityDecode(this.entity));
	domNode.appendChild(this.domNode);
};

exports.Entity = Entity;

})();
