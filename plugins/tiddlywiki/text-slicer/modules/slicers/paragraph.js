/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/paragraph.js
type: application/javascript
module-type: slicer

Handle slicing heading nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processParagraphNode = function(domNode,tagName) {
	var text = $tw.utils.htmlEncode(domNode.textContent);
	if(tagName === "p") {
		if(!this.isBlank(text)) {
			var parentTitle = this.parentStack[this.parentStack.length - 1].title,
				tags = [];
			if(domNode.className.trim() !== "") {
				tags = tags.concat(domNode.className.split(" "));
			}
			this.addToList(parentTitle,this.addTiddler({
				"toc-type": "paragraph",
				title: this.makeUniqueTitle("paragraph",text),
				text: text,
				tags: tags
			}));
			return true;
		}
	} 
	return false;
};

})();
