/*\
title: $:/core/modules/macros/tags.js
type: application/javascript
module-type: macro

Implements the tags macro.

{{{
<<tags template:MyTagTemplate>>	
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "tags",
	dependentOnContextTiddler: true,
	params: {
		template: {byName: true, type: "tiddler"},
		filter: {byName: true, type: "filter"}
	}
};

exports.executeMacro = function() {
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle),
		child = $tw.Tree.Element("div",{"class":"tw-tags-wrapper"},[]);
	if(tiddler && tiddler.fields.tags) {
		for(var t=0; t<tiddler.fields.tags.length; t++) {
			var tag = tiddler.fields.tags[t];
			child.children.push($tw.Tree.Macro("tiddler",{
				srcParams: {target: tag,template: this.params.template},
				wiki: this.wiki,
				isBlock: false
			}));
		}
	}
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

})();
