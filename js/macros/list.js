/*\
title: js/macros/list.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

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
		type: {byName: "default", type: "text", optional: false},
		template: {byName: true, type: "tiddler", optional: true},
		emptyMessage: {byName: true, type: "text", optional: true}
	},
	handler: function(type,tiddler,store,params) {
		var templateType = "text/x-tiddlywiki",
			templateText = "<<view title link>>",
			template = params.template ? store.getTiddler(params.template) : null,
			output = [],
			isHtml = type === "text/html",
			encoder = isHtml ? utils.htmlEncode : function(x) {return x;},
			pushTag = isHtml ? function(x) {output.push(x);} : function(x) {},
			handler,
			t;
		if(template) {
			templateType = template.type;
			templateText = template.text;
		}
		handler = handlers[params.type];
		handler = handler || handlers.all;
		var tiddlers = handler(store);
		if(tiddlers.length === 0) {
			return params.emptyMessage ? encoder(params.emptyMessage) : "";
		} else {
			var fn = store.compileText(templateType,templateText,type);
			pushTag("<ul>");
			for(t=0; t<tiddlers.length; t++) {
				pushTag("<li>");
				output.push(fn(store.getTiddler(tiddlers[t]),store,utils));
				pushTag("</li>");	
			}
			pushTag("</ul>");
			return output.join("");
		}
	}
};

})();
