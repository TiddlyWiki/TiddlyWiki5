/*\
title: js/macros/link.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var HTML = require("../HTML.js").HTML,
	utils = require("../Utils.js");

var isLinkExternal = function(target) {
	var externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(target);
};

exports.macro = {
	name: "link",
	wrapperTag: "span",
	types: ["text/html","text/plain"],
	params: {
		target: {byName: "default", type: "tiddler", rel: "link", optional: false}
	},
	events: {
		click: function(event,node,tiddler,store,params) {
			if(isLinkExternal(params.target)) {
				event.target.setAttribute("target","_blank");
				return true;
			} else {
				var navEvent = document.createEvent("Event");
				navEvent.initEvent("tw-navigate",true,true);
				navEvent.navigateTo = params.target;
				node.dispatchEvent(navEvent); 
				event.preventDefault();
				return false;
			}
		}
	},
	render: function(type,tiddler,store,params,content) {
		var classes = ["tw-tiddlylink"],
			target = params.target;
		if(isLinkExternal(params.target)) {
			classes.push("tw-tiddlylink-external");
		} else {
			classes.push("tw-tiddlylink-internal");
			if(store.tiddlerExists(params.target)) {
				classes.push("tw-tiddlylink-resolves");
			} else {
				classes.push("tw-tiddlylink-missing");
			}
			target = encodeURIComponent(target);
		}
		return HTML(HTML.elem(
							"a",{
								href: target,
								"class": classes
							},[
								HTML.raw(content)
							]
				),type);
	}
};

})();
