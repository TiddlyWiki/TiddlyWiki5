/*\
title: js/macros/link.js

Implements the link macro.

A special callback function is used to massage links according to the needs of the host platform.

The linkMassager is stored in the `linkMassager` property of the store object. It is a function
that takes a `linkInfo` structure as the only parameter. It contains a hashmap of information
as follows:

	{
		to: the target of the link
		space: an optional space associated with the link
		isExternal: true if the link has been determined to be an external link by the default heuristics
		isMissing: true if a non-external link references a missing tiddler
		classes: an array of strings representing the CSS classes to be applied to the link. The default classes are already applied
		href: the href to be used in the link
	}

The linkMassager can modify the `classes` and `href` fields as required.

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

var isLinkExternal = function(to) {
	var externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(to);
};

exports.macro = {
	name: "link",
	params: {
		to: {byName: "default", type: "tiddler", skinny: true},
		space: {byName: true, type: "text"}
	},
	events: {
		click: function(event) {
			if(isLinkExternal(this.params.to)) {
				event.target.setAttribute("target","_blank");
				return true;
			} else {
				var navEvent = document.createEvent("Event");
				navEvent.initEvent("tw-navigate",true,true);
				navEvent.navigateTo = this.params.to;
				event.target.dispatchEvent(navEvent); 
				event.preventDefault();
				return false;
			}
		}
	},
	execute: function() {
		// Assemble the information about the link
		var linkInfo = {
			to: this.params.to,
			space: this.params.space
		};
		// Generate the default link characteristics
		linkInfo.isExternal = isLinkExternal(linkInfo.to);
		if(!linkInfo.isExternal) {
			linkInfo.isMissing = !this.store.tiddlerExists(linkInfo.to);
		}
		linkInfo.href = encodeURIComponent(linkInfo.to);
		// Generate the default classes for the link
		linkInfo.classes = ["tw-tiddlylink"];
		if(linkInfo.isExternal) {
			linkInfo.classes.push("tw-tiddlylink-external");
		} else {
			linkInfo.classes.push("tw-tiddlylink-internal");
			if(linkInfo.isMissing) {
				linkInfo.classes.push("tw-tiddlylink-missing");
			} else {
				linkInfo.classes.push("tw-tiddlylink-resolves");
			}
		}
		// Invoke the link massager if defined
		if(this.store.linkMassager) {
			this.store.linkMassager(linkInfo);
		}
		// Figure out the classes to assign to the link
		var content = [Renderer.ElementNode(
							"a",{
								href: linkInfo.href,
								"class": linkInfo.classes
							},this.cloneChildren())];
		for(var t=0; t<content.length; t++) {
			content[t].execute(this.parents,this.tiddlerTitle);
		}
		return content;
	}
};

})();
