/*\
title: $:/core/modules/macros/link.js
type: application/javascript
module-type: macro

Implements the link macro.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var isLinkExternal = function(to) {
	var externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(to);
};

exports.info = {
	name: "link",
	params: {
		to: {byName: "default", type: "tiddler", skinny: true},
		space: {byName: true, type: "text"}
	},
	events: ["click"]
};

exports.handleEvent = function (event) {
	if(event.type === "click") {
		if(isLinkExternal(this.params.to)) {
			event.target.setAttribute("target","_blank");
			return true;
		} else {
			var navEvent = document.createEvent("Event");
			navEvent.initEvent("tw-navigate",true,true);
			navEvent.navigateTo = this.params.to;
			navEvent.navigateFrom = this;
			event.target.dispatchEvent(navEvent); 
			event.preventDefault();
			return false;
		}
	}
};

exports.executeMacro = function() {
	// Assemble the information about the link
	var linkInfo = {
		to: this.params.to,
		space: this.params.space
	};
	// Generate the default link characteristics
	linkInfo.isExternal = isLinkExternal(linkInfo.to);
	if(!linkInfo.isExternal) {
		linkInfo.isMissing = !this.wiki.tiddlerExists(linkInfo.to);
	}
	linkInfo.attributes = {
		href: linkInfo.to
	};
	if(!linkInfo.isExternal) {
		linkInfo.attributes.href = encodeURIComponent(linkInfo.to);
	}
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
	// Create the link
	var children;
	if(linkInfo.suppressLink) {
		children = this.cloneContent();
	} else { 
		children = [$tw.Tree.Element("a",linkInfo.attributes,this.cloneContent())];
	}
	for(var t=0; t<children.length; t++) {
		children[t].execute(this.parents,this.tiddlerTitle);
	}
	return children;
};

})();
