/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/def-list.js
type: application/javascript
module-type: slicer

Handle slicing definition list nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processDefListNode = function(domNode,tagName) {
	if(domNode.nodeType === 1 && tagName === "dl") {
		var title = this.makeUniqueTitle("def-list-" + tagName),
			parentTitle = this.parentStack[this.parentStack.length - 1].title,
			tags = [];
		if(domNode.className && domNode.className.trim() !== "") {
			tags = tags.concat(domNode.className.split(" "));
		}
		this.addToList(parentTitle,title);
		this.parentStack.push({type: tagName, title: this.addTiddler({
			"toc-type": "def-list",
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
