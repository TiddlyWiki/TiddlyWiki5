/*\
title: $:/core/modules/macros/hide.js
type: application/javascript
module-type: macro

A macro that selectively hides its children

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "hide",
	params: {
		tiddler: {byName: "default", type: "tiddler"},
		notequal: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var attributes = {}, children, text, show = false;
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	if(this.hasParameter("tiddler")) {
		text = this.wiki.getTextReference(this.params.tiddler);
		if(this.hasParameter("notequal")) {
			if(text === this.params.notequal) {
				show = true;
			}
		}
		if(show) {
			children = this.content;
			for(var t=0; t<children.length; t++) {
				children[t].execute(this.parents,this.tiddlerTitle);
			}
		}
	}
	return $tw.Tree.Element(this.isBlock ? "div" : "span",attributes,children,{
		events: ["tw-navigate"],
		eventHandler: this
	});
};

})();
