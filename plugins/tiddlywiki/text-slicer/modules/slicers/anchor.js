/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/anchor.js
type: application/javascript
module-type: slicer

Handle slicing anchor nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processAnchorNode = function(domNode,tagName) {
	if(domNode.nodeType === 1 && tagName === "a") {
		var id = domNode.getAttribute("id");
		if(id) {
			this.registerAnchor(id);
			return true;
		}
	} 
	return false;
};

})();
