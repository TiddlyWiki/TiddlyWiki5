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
	dependentAll: true, // Tiddlers containing <<transclude>> macro are dependent on every tiddler
	params: {
		filter: {byPos: 0, type: "filter"},
		title: {byPos: 1, type: "tiddler"},
		template: {byName: true, type: "tiddler"},
		templateText: {byName: true, type: "text"},
		emptyMessage: {byName: true, type: "text"}
	}
};

/*
Return the list of tiddlers to be transcluded
*/
exports.getTiddlerList = function() {
	if(this.hasParameter("filter")) {
		return this.wiki.filterTiddlers(this.params.filter,this.tiddlerTitle);
	} else if(this.hasParameter("title")) {
		return [this.params.title];
	} else {
		return [this.tiddlerTitle];
	}
};

/*
Get the parse tree of the template text to be used
	parents: array of tiddler titles of parents in the render tree
*/
exports.getTemplateParseTree = function(parents) {
	if(this.hasParameter("templateText")) {
		// Parse the template
		return this.wiki.parseText("text/x-tiddlywiki",this.params.templateText);
	} else {
		if(this.hasParameter("template")) {
			// Check for recursion
			if(parents.indexOf(this.params.template) !== -1) {
				return $tw.Tree.errorNode("Tiddler recursion error in <<transclude>> macro");	
			}
			parents.push(this.params.template);
			return this.wiki.parseTiddler(this.params.template);
		} else {
			return this.wiki.parseText("text/x-tiddlywiki","<<view text wikified>>");
		}
	}
};

exports.executeMacro = function() {
console.log("Executing transclude macro",this.params.filter,this.tiddlerTitle);
	var templateTiddler,templateText,t,title,templateParseTree,
		nodes,node,c,
		parents = this.parents.slice(0);
	// Clear the tiddler list
	this.tiddlerList = this.getTiddlerList();
	// Ensure we don't recurse back into ourselves
	parents.push(this.tiddlerTitle);
	// Get the template
	templateParseTree = this.getTemplateParseTree(parents);
	// Use the empty message if the list is empty
	if(this.tiddlerList.length === 0 && this.hasParameter("emptyMessage")) {
		nodes = this.wiki.parseText("text/x-tiddlywiki",this.params.emptyMessage).tree;
		for(c=0; c<nodes.length; c++) {
			nodes[c].execute(this.parents,this.tiddlerTitle);
		}
	} else {
		// Render the tiddlers through the template
		nodes = [];
		for(t=0; t<this.tiddlerList.length; t++) {
			title = this.tiddlerList[t];
			for(c=0; c<templateParseTree.tree.length; c++) {
				node = templateParseTree.tree[c].clone();
				node.execute(parents,title);
				nodes.push(node);
			}
		}
	}
	// Return
	var attributes = {"class": ["tw-transclusion"]};
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	return $tw.Tree.Element("div",attributes,nodes);
};


exports.refreshInDom = function(changes) {
console.log("Refreshing transclude macro",this.params.filter,this.tiddlerTitle);
	var doRefresh = false;
	// Do a refresh if any of our parameters have changed
	doRefresh = doRefresh || (this.hasParameter("template") && $tw.utils.hop(changes,this.params.template));
	// Check if we need to do a full refresh
	if(doRefresh) {
		// Re-execute the macro to refresh it
		this.reexecuteInDom();
	} else {
		// Do a selective refresh
	}
};

})();
