/*\
title: js/macros/link.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var HTML = require("../HTML.js").HTML,
	utils = require("../Utils.js");

exports.macro = {
	name: "link",
	wrapperTag: "span",
	types: ["text/html","text/plain"],
	params: {
		target: {byName: "default", type: "tiddler", rel: "link", optional: false}
	},
	events: {
		click: function(event,node,tiddler,store,params) {
			var navEvent = document.createEvent("Event");
			navEvent.initEvent("tw-navigate",true,true);
			navEvent.navigateTo = params.target;
			node.dispatchEvent(navEvent); 
			event.preventDefault();
			return false;
		}
	},
	render: function(type,tiddler,store,params,content) {
		return HTML(HTML.elem(
							"a",{
								href: params.target,
								"class": store.adjustClassesForLink([],params.target)
							},[
								HTML.raw(content)
							]
				),type);
	}
};

})();
