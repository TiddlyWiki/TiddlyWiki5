/*\
title: $:/core/modules/macros/view/viewers/wikified.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as wikified text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function renderValue(tiddler,field,value,viewMacro) {
	// Check for recursion
	var parents = viewMacro.parents,
		children,t,childrenClone = [];
	if(tiddler && viewMacro.params.field === "text") {
		if(parents.indexOf(tiddler.fields.title) !== -1) {
			children = [$tw.Tree.errorNode("Tiddler recursion error in <<view>> macro")];
		} else {
			children = viewMacro.wiki.parseTiddler(tiddler.fields.title).tree;
		}
		parents = parents.slice(0);
		parents.push(tiddler.fields.title);
	} else {
		children = viewMacro.wiki.parseText("text/x-tiddlywiki",value).tree;
	}
	// Clone and execute the parsed wikitext
	for(t=0; t<children.length; t++) {
		childrenClone.push(children[t].clone());
	}
	for(t=0; t<childrenClone.length; t++) {
		childrenClone[t].execute(parents,viewMacro.tiddlerTitle);
	}
	return $tw.Tree.Element(viewMacro.isBlock ? "div" : "span",{},childrenClone);
}

exports["wikified"] = renderValue;

})();
