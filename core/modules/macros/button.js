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
	// Get the textref of the popup state tiddler
	var textRef = this.params.popup;
	if(this.hasParameter("qualifyTiddlerTitles") && this.params.qualifyTiddlerTitles === "yes") {
		textRef = "(" + this.parents.join(",") + "," + this.tiddlerTitle + ")" + textRef;
	}
	// Get the current popup state tiddler 
	var value = this.wiki.getTextReference(textRef,"",this.tiddlerTitle);
	// Check if the popup is open by checking whether it matches "(<x>,<y>)"
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/;
	if(popupLocationRegExp.test(value)) {
		$tw.popup.cancel();
	} else {
		// Set the position if we're opening it
		this.wiki.setTextReference(textRef,
			"(" + this.child.domNode.offsetLeft + "," + this.child.domNode.offsetTop + "," + 
				this.child.domNode.offsetWidth + "," + this.child.domNode.offsetHeight + ")",
			this.tiddlerTitle,true);
		$tw.popup.popup(textRef);
	}
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
	return $tw.Tree.Element("button",attributes,this.content,{
		events: ["click"],
		eventHandler: this
	});
};

})();
