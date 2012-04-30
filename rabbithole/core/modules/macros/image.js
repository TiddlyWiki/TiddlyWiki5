/*\
title: $:/core/macros/image.js
type: application/javascript
module-type: macro

\*/
(function(){

/*jslint node: true */
"use strict";

exports.info = {
	name: "image",
	params: {
		src: {byName: "default", type: "tiddler"},
		text: {byName: true, type: "text"},
		alignment: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	if(this.wiki.tiddlerExists(this.params.src)) {
		var imageTree = this.wiki.parseTiddler(this.params.src).tree,
			cloneImage = [];
		for(var t=0; t<imageTree.length; t++) {
			cloneImage.push(imageTree[t].clone());
		}
		if(this.params.text) {
			return [$tw.Tree.Element("div",{
					alt: this.params.text,
					title: this.params.text
				},cloneImage)];
		} else {
			return cloneImage;	
		}
	} else {
		return [$tw.Tree.Element("img",{
			src: this.params.src,
			alt: this.params.text,
			title: this.params.text
		})];
	}
};

})();
