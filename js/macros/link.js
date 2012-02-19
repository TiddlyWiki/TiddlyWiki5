/*\
title: js/macros/link.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

var isLinkExternal = function(target) {
	var externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(target);
};

exports.macro = {
	name: "link",
	types: ["text/html","text/plain"],
	params: {
		target: {byName: "default", type: "tiddler", skinny: true}
	},
	events: {
		click: function(event,macroNode) {
			if(isLinkExternal(macroNode.params.target)) {
				event.target.setAttribute("target","_blank");
				return true;
			} else {
				var navEvent = document.createEvent("Event");
				navEvent.initEvent("tw-navigate",true,true);
				navEvent.navigateTo = macroNode.params.target;
				event.target.dispatchEvent(navEvent); 
				event.preventDefault();
				return false;
			}
		}
	},
	execute: function(macroNode,tiddler,store) {
		var classes = ["tw-tiddlylink"],
			target = macroNode.params.target;
		if(isLinkExternal(target)) {
			classes.push("tw-tiddlylink-external");
		} else {
			classes.push("tw-tiddlylink-internal");
			if(store.tiddlerExists(target)) {
				classes.push("tw-tiddlylink-resolves");
			} else {
				classes.push("tw-tiddlylink-missing");
			}
			target = encodeURIComponent(target);
		}
		var content = [Renderer.ElementNode(
							"a",{
								href: target,
								"class": classes
							},macroNode.cloneChildren())];
		for(var t=0; t<content.length; t++) {
			content[t].execute(macroNode.parents,tiddler);
		}
		return content;
	}
};

})();
