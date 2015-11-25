/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/text.js
type: application/javascript
module-type: slicer

Handle slicing text nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processTextNode = function(domNode,tagName) {
	if(domNode.nodeType === 3) {
		this.appendToCurrentContainer($tw.utils.htmlEncode(domNode.textContent));
		return true;
	} 
	return false;
};

})();
