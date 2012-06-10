/*\
title: $:/core/modules/macros/color.js
type: application/javascript
module-type: macro

Color macro.

Applies the specified colour to its content. By default, the colour value is obtained from the `color` field of the current tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "color",
	params: {
		"default": {byName: "default", type: "text"},
	}
};

exports.executeMacro = function() {
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle),
		attributes = {
			style: {
				"background-color": (tiddler && tiddler.fields.color) || this.params["default"]
			}
		};
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("span",attributes,this.content);
};


})();
