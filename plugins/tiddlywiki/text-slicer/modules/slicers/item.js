/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/item.js
type: application/javascript
module-type: slicer

Handle slicing heading nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processListItemNode = function(domNode,tagName) {
	var text = $tw.utils.htmlEncode(domNode.textContent);
	if(tagName === "li") {
		if(!this.isBlank(text)) {
			var title = this.makeUniqueTitle("list-item",text),
				parentTitle = this.parentStack[this.parentStack.length - 1].title,
				tags = [];
			if(domNode.className.trim() !== "") {
				tags = tags.concat(domNode.className.split(" "));
			}
			this.addToList(parentTitle,title);
			this.addTiddler({
				"toc-type": "item",
				title: title,
				text: text,
				list: [],
				tags: tags
			});
			return true;
		}
	}
	return false;
};

})();
