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
	if(tagName === "h1" || tagName === "h2" || tagName === "h3" || tagName === "h4") {
		var text = $tw.utils.htmlEncode(domNode.textContent);
		if(!this.isBlank(text)) {
			var title = this.makeUniqueTitle("heading",text),
				parentTitle = this.popParentStackUntil(tagName),
				tags = [];
			if(domNode.className.trim() !== "") {
				tags = tags.concat(domNode.className.split(" "));
			}
			this.addToList(parentTitle,title);
			this.parentStack.push({type: tagName, title: this.addTiddler({
				"toc-type": "heading",
				"toc-heading-level": tagName,
				title: title,
				text: text,
				list: [],
				tags: tags
			})});
			return true;
		}
	}
	return false;
};

})();
