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
		if(src) {
			var containerTitle = this.getTopContainer(),
				containerTiddler = this.getTiddler(containerTitle),
				title, tiddler = {
					"toc-type": "image"
				};
			if(src.substr(0,5) === "data:") {
				var parts = src.toString().substr(5).split(";base64,");
				tiddler.type = parts[0];
				tiddler.text = parts[1];
				var contentTypeInfo = $tw.config.contentTypeInfo[tiddler.type] || {extension: ""};
				title = this.makeUniqueTitle("image " + containerTitle) + contentTypeInfo.extension;
				tiddler.title = title;
				this.addTiddler(tiddler);
			} else {
				title = $tw.utils.resolvePath(src,this.baseTiddlerTitle);
			}
			switch(containerTiddler["toc-type"]) {
				case "document":
					// Make the image be the next child of the document
					this.addToList(containerTitle,title);
					break;
				case "heading":
					// Make the image be the older sibling of the heading
					var parentTitle = this.parentStack[this.parentStack.length - 2].title;
					this.insertBeforeListItem(parentTitle,title,containerTitle);
					break;
				case "paragraph":
					// Make the image be the older sibling of the paragraph
					var parentTitle = this.parentStack[this.parentStack.length - 1].title;
					this.insertBeforeListItem(parentTitle,title,containerTitle);
					break;
				case "item":
					// Create a new older sibling item to contain the image
					var parentTitle = this.parentStack[this.parentStack.length - 1].title,
						itemTitle = this.makeUniqueTitle("image-item-wrapper " + containerTitle),
						itemTiddler = {
							title: itemTitle,
							"toc-type": "item",
							list: [title],
							text: "[img[" + title + "]]"
						};
					this.addTiddler(itemTiddler);
					this.insertBeforeListItem(parentTitle,itemTitle,containerTitle);
					break;
			}
			// this.appendToCurrentContainer("[img[" + title + "]]");
			return true;
		}
	} 
	return false;
};

})();
