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
		toggle: {byName: true, type: "tiddler"},
		set: {byName: true, type: "tiddler"},
		on: {byName: true, type: "text"},
		off: {byName: true, type: "text"},
		qualifyTiddlerTitles: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	},
	events: ["click"]
};

exports.handleEvent = function(event) {
	if(event.type === "click") {
		if(this.hasParameter("message")) {
			var buttonEvent = document.createEvent("Event");
			buttonEvent.initEvent("tw-" + this.params.message,true,true);
			buttonEvent.tiddlerTitle = this.tiddlerTitle;
			buttonEvent.commandOrigin = this;
			event.target.dispatchEvent(buttonEvent);
		}
		if(this.hasParameter("toggle")) {
			var title = this.params.toggle,
				on = this.params.on || "open",
				off = this.params.off || "closed";
			if(this.hasParameter("qualifyTiddlerTitles") && this.params.qualifyTiddlerTitles === "yes") {
				title = "(" + this.parents.join(",") + "," + this.tiddlerTitle + ")" + title;
			}
			var tiddler = this.wiki.getTiddler(title),
				value = tiddler ? tiddler.fields.text : undefined;
			if(value === this.params.on) {
				value = this.params.off;
			} else {
				value = this.params.on;
			}
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: title, text: value}));
		}
		event.preventDefault();
		return false;
	}
	return true;
};

exports.executeMacro = function() {
	var attributes = {};
	if(this.hasParameter("class")) {
		attributes["class"] = this.params["class"].split(" ");
	}
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("button",attributes,this.content);
};

})();
