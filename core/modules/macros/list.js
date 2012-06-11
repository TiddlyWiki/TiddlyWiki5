/*\
title: $:/core/modules/macros/list.js
type: application/javascript
module-type: macro

List macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var handlers = {
	all: function(wiki) {
		return wiki.getTiddlers("title","excludeLists");
	},
	missing: function(wiki) {
		return wiki.getMissingTitles();
	},
	orphans: function(wiki) {
		return wiki.getOrphanTitles();
	},
	shadowed: function(wiki) {
		return wiki.getShadowTitles();
	},
	touched: function(wiki) {
		// Server syncing isn't implemented yet
		return [];
	},
	filter: function(wiki) {
		// Filters aren't implemented yet
		return [];
	}
};

exports.info = {
	name: "list",
	dependentAll: true, // Tiddlers containing <<list>> macro are dependent on every tiddler
	params: {
		type: {byName: "default", type: "text"},
		template: {byName: true, type: "tiddler"},
		emptyMessage: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var templateType = "text/x-tiddlywiki",
		templateText = "<<view title link>>",
		template = this.params.template ? this.wiki.getTiddler(this.params.template) : null,
		children = [],
		t,
		parents = this.parents,
		attributes = {};
	if(template) {
		parents = parents.slice(0);
		parents.push(template.title);
		templateType = template.type;
		templateText = template.text;
	}
	var handler = handlers[this.params.type];
	handler = handler || handlers.all;
	var tiddlers = handler(this.wiki);
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	if(tiddlers.length === 0) {
		return $tw.Tree.Text(this.params.emptyMessage || "");
	} else {
		var templateTree = this.wiki.parseText(templateType,templateText).tree;
		for(t=0; t<tiddlers.length; t++) {
			var cloneTemplate = [];
			for(var c=0; c<templateTree.length; c++) {
				cloneTemplate.push(templateTree[c].clone());
			}
			var listNode = $tw.Tree.Element("li",null,cloneTemplate);
			listNode.execute(parents,tiddlers[t]);
			children.push(listNode);
		}
		return $tw.Tree.Element("ul",attributes,children);
	}
};

})();
