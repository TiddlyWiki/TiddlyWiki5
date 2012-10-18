/*\
title: $:/core/modules/macros/view/viewers/transclude.js
type: application/javascript
module-type: viewer

A viewer that transcludes the tiddler whose title is specified in the viewed field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function renderValue(tiddler,field,value,viewMacro) {
	if(tiddler && viewMacro.params.field && (viewMacro.params.field in tiddler.fields)) {
		var children = viewMacro.wiki.parseTiddler(tiddler.fields[viewMacro.params.field]).tree,
			childrenClone = [],t;
		for(t=0; t<children.length; t++) {
			childrenClone.push(children[t].clone());
		}
		for(t=0; t<childrenClone.length; t++) {
			childrenClone[t].execute(viewMacro.parents,viewMacro.tiddlerTitle);
		}
		return $tw.Tree.Element(viewMacro.isBlock ? "div" : "span",{},childrenClone);
	}
}

exports["transclude"] = renderValue;

})();
