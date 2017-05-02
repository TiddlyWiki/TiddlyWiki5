/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/heading.js
type: application/javascript
module-type: slicer

Handle slicing heading nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processHeadingNode = function(domNode,tagName) {
	if(domNode.nodeType === 1 && (tagName === "h1" || tagName === "h2" || tagName === "h3" || tagName === "h4")) {
		var text = $tw.utils.htmlEncode(domNode.textContent);
		var title = this.makeUniqueTitle("heading " + text),
			parentTitle = this.popParentStackUntil(tagName),
			tags = [];
		if(domNode.className && domNode.className.trim() !== "") {
			tags = tags.concat(domNode.className.split(" "));
		}
		this.addToList(parentTitle,title);
		this.parentStack.push({type: tagName, title: this.addTiddler({
			"toc-type": "heading",
			"toc-heading-level": tagName,
			title: title,
			text: "",
			list: [],
			tags: tags
		})});
		this.currentTiddler = title;
		this.containerStack.push(title);
		this.processNodeList(domNode.childNodes);
		this.containerStack.pop();
		return true;
	}
	return false;
};

})();
