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
		attributes: a hashmap of HTML attributes to add to the `<a>` tag
		suppressLink: see below
	}

The link massager is called with the `attributes` hashmap initialised as follows:

	{
		class: an array of strings representing the CSS classes to be applied to the link. The default classes are already applieda according to whether the heuristics decide the tiddler is external or missing
		href: the href to be used in the link (defaults to the unencoded value of the `to` parameter)
	}

Note that the member `class` cannot be referred to with JavaScript dot syntax: use `linkInfo.attributes["class"]` rather than `linkInfo.attributes.class`.

The linkMassager can modify the `classes` and `href` fields as required, and add additional HTML attributes, such as the `target` attribute.

The linkMassager can cause the link to be suppressed by setting the `linkInfo.suppressLink` to `true`. The content of the link will still be displayed.

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
		linkInfo.attributes = {
			href: linkInfo.to
		};
		// Generate the default classes for the link
		linkInfo.attributes["class"] = ["tw-tiddlylink"];
		if(linkInfo.isExternal) {
			linkInfo.attributes["class"].push("tw-tiddlylink-external");
		} else {
			linkInfo.attributes["class"].push("tw-tiddlylink-internal");
			if(linkInfo.isMissing) {
				linkInfo.attributes["class"].push("tw-tiddlylink-missing");
			} else {
				linkInfo.attributes["class"].push("tw-tiddlylink-resolves");
			}
		}
		// Invoke the link massager if defined
		if(this.store.linkMassager) {
			this.store.linkMassager(linkInfo);
		}
		// Create the link
		var content;
		if(linkInfo.suppressLink) {
			content = this.cloneChildren();
		} else { 
			content = [Renderer.ElementNode("a",linkInfo.attributes,this.cloneChildren())];
		}
		for(var t=0; t<content.length; t++) {
			content[t].execute(this.parents,this.tiddlerTitle);
		}
		return content;
	}
};

})();
