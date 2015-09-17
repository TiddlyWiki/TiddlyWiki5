/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/image.js
type: application/javascript
module-type: slicer

Handle slicing img nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processImageNode = function(domNode,tagName) {
	if(domNode.nodeType === 1 && tagName === "img") {
		var src = domNode.getAttribute("src");
		if(src && src.substr(0,5) === "data:") {
			var parts = src.toString().substr(5).split(";base64,"),
				containerTitle = this.getTopContainer(),
				title = this.makeUniqueTitle("image",containerTitle);
			this.addTiddler({
				title: title,
				type: parts[0],
				text: parts[1]
			});
			this.appendToCurrentContainer("[img[" + title + "]]");
		}
		return true;
	} 
	return false;
};

})();
