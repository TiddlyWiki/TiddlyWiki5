/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/list.js
type: application/javascript
module-type: slicer

Handle slicing list nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processListNode = function(domNode,tagName) {
	if(domNode.nodeType === 1 && (tagName === "ul" || tagName === "ol")) {
		var title = this.makeUniqueTitle("list " + tagName),
			parentTitle = this.parentStack[this.parentStack.length - 1].title,
			tags = [];
		if(domNode.className && domNode.className.trim() !== "") {
			tags = tags.concat(domNode.className.split(" "));
		}
		this.addToList(parentTitle,title);
		this.parentStack.push({type: tagName, title: this.addTiddler({
			"toc-type": "list",
			"toc-list-type": tagName,
			"toc-list-filter": "[list<currentTiddler>!has[draft.of]]",
			text: "",
			title: title,
			list: [],
			tags: tags
		})});
		this.currentTiddler = title;
		this.processNodeList(domNode.childNodes);
		this.parentStack.pop();
		return true;
	}
	return false;
};

})();
