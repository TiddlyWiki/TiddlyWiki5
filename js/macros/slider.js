/*\
title: js/macros/slider.js

\*/
(function(){

/*jslint node: true */
"use strict";

var HTML = require("../HTML.js").HTML,
	utils = require("../Utils.js");

exports.macro = {
	name: "slider",
	types: ["text/html","text/plain"],
	params: {
		name: {byPos: 0, type: "text", optional: false},
		targetTiddler: {byPos: 1, type: "tiddler", optional: false},
		label: {byPos: 2, type: "text", optional: false},
		tooltip: {byPos: 3, type: "text", optional: true}
	},
	events: {
		click: function(event,node,tiddler,store,params) {
			var el = node.firstChild.firstChild.nextSibling;
			el.style.display = el.style.display === "block" ? "none" : "block";
			event.preventDefault();
			return false;
		}
	},
	render: function(type,tiddler,store,params) {
		if(type === "text/html") {
			return HTML(HTML.slider(params.name,
										params.label,
										params.tooltip,
										HTML.raw(store.renderTiddler(type,params.targetTiddler))),type);
		} else if(type === "text/plain") {
			return store.renderTiddler(type,params.target);
		}
		return null;	
	}
};

})();

