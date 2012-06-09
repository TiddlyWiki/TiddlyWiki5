/*\
title: $:/core/modules/macros/image.js
type: application/javascript
module-type: macro

Image macro for displaying images

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
			cloneImage = imageTree[0].clone();
		if(this.params.text) {
			return $tw.Tree.Element("div",{
					alt: this.params.text,
					title: this.params.text
				},[cloneImage]);
		} else {
			return cloneImage;	
		}
	} else {
		return $tw.Tree.Element("img",{
			src: this.params.src,
			alt: this.params.text,
			title: this.params.text
		});
	}
};

})();
