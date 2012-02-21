/*\
title: js/macros/list.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

var handlers = {
	all: function(store) {
		return store.getTitles("title","excludeLists");
	},
	missing: function(store) {
		return store.getMissingTitles();
	},
	orphans: function(store) {
		return store.getOrphanTitles();
	},
	shadowed: function(store) {
		return store.getShadowTitles();
	},
	touched: function(store) {
		// Server syncing isn't implemented yet
		return [];
	},
	filter: function(store) {
		// Filters aren't implemented yet
		return [];
	}
};

exports.macro = {
	name: "list",
	types: ["text/html","text/plain"],
	dependentAll: true, // Tiddlers containing <<list>> macro are dependent on every tiddler
	params: {
		type: {byName: "default", type: "text"},
		template: {byName: true, type: "tiddler"},
		emptyMessage: {byName: true, type: "text"}
	},
	execute: function() {
		var templateType = "text/x-tiddlywiki",
			templateText = "<<view title link>>",
			template = this.params.template ? this.store.getTiddler(this.params.template) : null,
			content = [],
			t,
			parents = this.parents;
		if(template) {
			parents = parents.slice(0);
			parents.push(template.title);
			templateType = template.type;
			templateText = template.text;
		}
		var handler = handlers[this.params.type];
		handler = handler || handlers.all;
		var tiddlers = handler(this.store);
		if(tiddlers.length === 0) {
			return [Renderer.TextNode(this.params.emptyMessage || "")];
		} else {
			var templateTree = this.store.parseText(templateType,templateText).tree;
			for(t=0; t<tiddlers.length; t++) {
				var cloneTemplate = [];
				for(var c=0; c<templateTree.length; c++) {
					cloneTemplate.push(templateTree[c].clone());
				}
				var listNode = Renderer.ElementNode("li",null,cloneTemplate);
				listNode.execute(parents,this.store.getTiddler(tiddlers[t]));
				content.push(listNode);
			}
			return [Renderer.ElementNode("ul",null,content)];
		}
	}
};

})();
