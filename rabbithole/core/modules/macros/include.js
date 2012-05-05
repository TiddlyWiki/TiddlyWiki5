/*\
title: $:/core/modules/macros/include.js
type: application/javascript
module-type: macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "^",
	params: {
		target: {byPos: 0, type: "tiddler"},
		as: {byPos: 1, as: "text"}
	}
};

exports.executeMacro = function() {
	var tiddler = this.hasParameter("target") ? this.wiki.getTiddler(this.params.target) : null,
		as = this.params.as,
		children = [];
	if(tiddler) {
		as = as || tiddler.fields.as || "text/plain";
		children = this.wiki.parseText(as,tiddler.fields.text).tree;
		for(var t=0; t<children.length; t++) {
			children[t].execute(this.parents,this.tiddlerTitle);
		}
	}
	return children;
};


})();
