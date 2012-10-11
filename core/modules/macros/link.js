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
		throughField: {byname: true, type: "text"},
		space: {byName: true, type: "text"}
	}
};

exports.handleEvent = function (event) {
	if(event.type === "click") {
		if(isLinkExternal(this.linkInfo.to)) {
			event.target.setAttribute("target","_blank");
			return true;
		} else {
			var navEvent = document.createEvent("Event");
			navEvent.initEvent("tw-navigate",true,true);
			navEvent.navigateTo = this.linkInfo.to;
			navEvent.navigateFrom = this;
			event.target.dispatchEvent(navEvent); 
			event.preventDefault();
			return false;
		}
	}
};

exports.executeMacro = function() {
	// Assemble the information about the link
	this.linkInfo = {
		space: this.params.space
	};
	if(this.hasParameter("to")) {
		this.linkInfo.to = this.params.to;
	} else if(this.hasParameter("throughField") && this.tiddlerTitle) {
		var currTiddler = this.wiki.getTiddler(this.tiddlerTitle);
		if(currTiddler && this.params.throughField in currTiddler.fields) {
			this.linkInfo.to = currTiddler.fields[this.params.throughField];
		}
	}
	// Generate the default link characteristics
	this.linkInfo.isExternal = isLinkExternal(this.linkInfo.to);
	if(!this.linkInfo.isExternal) {
		this.linkInfo.isMissing = !this.wiki.tiddlerExists(this.linkInfo.to);
	}
	this.linkInfo.attributes = {
		href: this.linkInfo.to
	};
	if(!this.linkInfo.isExternal) {
		this.linkInfo.attributes.href = encodeURIComponent(this.linkInfo.to);
	}
	// Generate the default classes for the link
	this.linkInfo.attributes["class"] = ["tw-tiddlylink"];
	if(this.linkInfo.isExternal) {
		this.linkInfo.attributes["class"].push("tw-tiddlylink-external");
	} else {
		this.linkInfo.attributes["class"].push("tw-tiddlylink-internal");
		if(this.linkInfo.isMissing) {
			this.linkInfo.attributes["class"].push("tw-tiddlylink-missing");
		} else {
			this.linkInfo.attributes["class"].push("tw-tiddlylink-resolves");
		}
	}
	if(this.classes) {
		$tw.utils.pushTop(this.linkInfo.attributes["class"],this.classes);
	}
	// Create the link
	var child;
	if(this.linkInfo.suppressLink) {
		child = $tw.Tree.Element("span",{},this.content);
	} else { 
		child = $tw.Tree.Element("a",this.linkInfo.attributes,this.content,{events: ["click"], eventHandler: this});
	}
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

})();
