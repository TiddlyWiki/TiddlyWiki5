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
	params: {
		target: {byName: "default", type: "tiddler", skinny: true}
	},
	events: {
		click: function(event) {
			if(isLinkExternal(this.params.target)) {
				event.target.setAttribute("target","_blank");
				return true;
			} else {
				var navEvent = document.createEvent("Event");
				navEvent.initEvent("tw-navigate",true,true);
				navEvent.navigateTo = this.params.target;
				event.target.dispatchEvent(navEvent); 
				event.preventDefault();
				return false;
			}
		}
	},
	execute: function() {
		var classes = ["tw-tiddlylink"],
			target = this.params.target;
		if(isLinkExternal(target)) {
			classes.push("tw-tiddlylink-external");
		} else {
			classes.push("tw-tiddlylink-internal");
			if(this.store.tiddlerExists(target)) {
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
							},this.cloneChildren())];
		for(var t=0; t<content.length; t++) {
			content[t].execute(this.parents,this.store.getTiddler(this.tiddlerTitle));
		}
		return content;
	}
};

})();
