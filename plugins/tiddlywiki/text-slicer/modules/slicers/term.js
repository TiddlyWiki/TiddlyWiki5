/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicers/term.js
type: application/javascript
module-type: slicer

Handle slicing term nodes in definition lists

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.processTermNode = function(domNode,tagName) {
	var text = $tw.utils.htmlEncode(domNode.textContent);
	if(domNode.nodeType === 1 && tagName === "dt") {
		// if(!this.isBlank(text)) {
			var title = this.makeUniqueTitle("term " + text),
				parentTitle = this.parentStack[this.parentStack.length - 1].title,
				tags = [];
			if(domNode.className && domNode.className.trim() !== "") {
				tags = tags.concat(domNode.className.split(" "));
			}
			this.addToList(parentTitle,title);
			this.addTiddler({
				"toc-type": "term",
				title: title,
				text: "",
				list: [],
				tags: tags
			});
			this.currentTiddler = title;
			this.containerStack.push(title);
			// this.containerStack.push("Just testing" + new Date());
			this.processNodeList(domNode.childNodes);
			this.containerStack.pop();
			return true;
		// }
	}
	return false;
};

})();
