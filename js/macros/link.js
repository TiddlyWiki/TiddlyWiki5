/*\
title: js/macros/link.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "link",
	wrapperTag: "span",
	types: ["text/html","text/plain"],
	params: {
		target: {byName: "default", type: "tiddler", optional: false}
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
		if(type === "text/html") {
			return utils.stitchElement("a",{
				href: params.target
			},{
				content: content,
				classes: store.adjustClassesForLink([],params.target)
			});
		} else if (type === "text/plain") {
			return content;	
		}
	}
};

})();
