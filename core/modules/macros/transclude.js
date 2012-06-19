/*\
title: $:/core/modules/macros/transclude.js
type: application/javascript
module-type: macro

Transclude macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "transclude",
	params: {
		filter: {byPos: 0, type: "filter"},
		title: {byPos: 1, type: "tiddler"},
		templateTitle: {byName: true, type: "text"},
		templateText: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var titles,templateTiddler,templateText,t,title,templateParseTree,
		nodes,node,c,
		parents = this.parents;
	// Get the tiddlers we're transcluding
	if(this.hasParameter("filter")) {
		titles = this.wiki.filterTiddlers(this.params.filter,this.tiddlerTitle);
	} else if(this.hasParameter("title")) {
		titles = [this.params.title];
	} else {
		titles = [this.tiddlerTitle];
	}
	// Get the template
	if(this.hasParameter("templateText")) {
		// Parse the template
		templateParseTree = this.wiki.parseText("text/x-tiddlywiki",this.params.templateText);
	} else {
		if(this.hasParameter("templateTitle")) {
			// Check for recursion
			if(parents.indexOf(this.params.templateTitle) !== -1) {
				return $tw.Tree.errorNode("Tiddler recursion error in <<transclude>> macro");	
			} 
			parents = parents.slice(0);
			parents.push(this.params.templateTitle);
			templateParseTree = this.wiki.parseTiddler(this.params.templateTitle);
		} else {
			templateParseTree = this.wiki.parseText("text/x-tiddlywiki","<<view text wikified>>");
		}
	}
	// Render the tiddlers through the template
	nodes = [];
	for(t=0; t<titles.length; t++) {
		title = titles[t];
		for(c=0; c<templateParseTree.tree.length; c++) {
			node = templateParseTree.tree[c].clone();
			node.execute(parents,title);
			nodes.push(node);
		}
	}
	// Return
	var attributes = {"class": ["tw-transclusion"]};
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	return $tw.Tree.Element("div",attributes,nodes);
};

})();
