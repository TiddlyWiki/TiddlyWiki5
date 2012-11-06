/*\
title: $:/core/modules/macros/button.js
type: application/javascript
module-type: macro

Button macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "button",
	params: {
		message: {byName: "default", type: "text"},
		param: {byName: true, type: "text"},
		set: {byName: true, type: "tiddler"},
		setTo: {byName: true, type: "text"},
		popup: {byName: true, type: "tiddler"},
		hover: {byName: true, type: "text"},
		qualifyTiddlerTitles: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.dispatchMessage = function(event) {
	var buttonEvent = document.createEvent("Event");
	buttonEvent.initEvent("tw-" + this.params.message,true,true);
	buttonEvent.param = this.params.param;
	buttonEvent.tiddlerTitle = this.tiddlerTitle;
	event.target.dispatchEvent(buttonEvent);
};

exports.triggerPopup = function(event) {
	$tw.popup.triggerPopup({
		textRef: this.params.popup,
		domNode: this.child.domNode,
		qualifyTiddlerTitles: this.params.qualifyTiddlerTitles,
		contextTiddlerTitle: this.tiddlerTitle,
		contextParents: this.parents,
		wiki: this.wiki
	});
};

exports.setTiddler = function() {
	var set = this.params.set,
		setTo = this.params.setTo,
		tiddler = this.wiki.getTiddler(set);
	this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: set, text: setTo}));
};

exports.handleEvent = function(event) {
	if(event.type === "click") {
		if(this.hasParameter("message")) {
			this.dispatchMessage(event);
		}
		if(this.hasParameter("popup")) {
			this.triggerPopup(event);
		}
		if(this.hasParameter("set") && this.hasParameter("setTo")) {
			this.setTiddler();
		}
		event.preventDefault();
		return false;
	}
	if(event.type === "mouseover" || event.type === "mouseout") {
		if(this.hasParameter("popup")) {
			this.triggerPopup(event);
		}
		event.preventDefault();
		return false;
	}
	return true;
};

exports.executeMacro = function() {
	var attributes = {"class": []};
	if(this.hasParameter("class")) {
		$tw.utils.pushTop(attributes["class"],this.params["class"].split(" "));
	}
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	var events = ["click"];
	if(this.hasParameter("hover") && this.params.hover === "yes") {
		events.push("mouseover","mouseout");
	}
	return $tw.Tree.Element("button",attributes,this.content,{
		events: events,
		eventHandler: this
	});
};

})();
