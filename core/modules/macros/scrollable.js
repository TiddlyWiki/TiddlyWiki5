/*\
title: $:/core/modules/macros/scrollable.js
type: application/javascript
module-type: macro

Creates a scrollable frame around its content

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "scrollable",
	params: {
		width: {byName: true, type: "text"},
		height: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var innerClasses = ["tw-scrollable-inner"],
		innerAttributes = {
			"class": innerClasses,
			style: {
				overflow: "visible",
				position: "relative"
			}
		},
		outerClasses = ["tw-scrollable","tw-scrollable-outer"],
		outerAttributes = {
			"class": outerClasses,
			style: {
				overflow: "scroll",
				"white-space": "nowrap"
			}
		};
	if(this.hasParameter("class")) {
		outerClasses.push(this.params["class"]);
	}
	if(this.classes) {
		$tw.utils.pushTop(outerClasses,this.classes);
	}
	if(this.hasParameter("width")) {
		outerAttributes.style.width = this.params["width"];
	}
	if(this.hasParameter("height")) {
		outerAttributes.style.height = this.params["height"];
	}
	var innerFrame = $tw.Tree.Element("div",innerAttributes,this.content),
		outerFrame = $tw.Tree.Element("div",outerAttributes,[innerFrame]);
	outerFrame.execute(this.parents,this.tiddlerTitle);
	return outerFrame;
};

exports.postRenderInDom = function() {
};

})();
