/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/paragraph.js
type: application/javascript
module-type: slicer

Handle slicing paragraph nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processParagraphNode = function(domNode,tagName) {
	var text = $tw.utils.htmlEncode(domNode.textContent);
	if(domNode.nodeType === 1 && tagName === "p") {
		if(!this.isBlank(text)) {
			var parentTitle = this.parentStack[this.parentStack.length - 1].title,
				tags = [],
				title = this.makeUniqueTitle("paragraph " + text);
			if(domNode.className && domNode.className && domNode.className.trim() !== "") {
				tags = tags.concat(domNode.className.split(" "));
			}
			this.addToList(parentTitle,this.addTiddler({
				"toc-type": "paragraph",
				title: title,
				text: "",
				tags: tags
			}));
			this.currentTiddler = title;
			this.containerStack.push(title);
			this.processNodeList(domNode.childNodes);
			this.containerStack.pop();
			return true;
		}
	} 
	return false;
};

})();
