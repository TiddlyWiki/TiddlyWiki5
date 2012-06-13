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
		popup: {byName: true, type: "tiddler"},
		qualifyTiddlerTitles: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	},
	events: ["click", "tw-cancel-popup"]
};

exports.dispatchMessage = function(event) {
	var buttonEvent = document.createEvent("Event");
	buttonEvent.initEvent("tw-" + this.params.message,true,true);
	buttonEvent.tiddlerTitle = this.tiddlerTitle;
	event.target.dispatchEvent(buttonEvent);
};

exports.triggerPopup = function(event,cancel) {
	// Get the title of the popup state tiddler
	var title = this.params.popup;
	if(this.hasParameter("qualifyTiddlerTitles") && this.params.qualifyTiddlerTitles === "yes") {
		title = "(" + this.parents.join(",") + "," + this.tiddlerTitle + ")" + title;
	}
	// Get the popup state tiddler and the the text value
	var tiddler = this.wiki.getTiddler(title),
		value = tiddler ? tiddler.fields.text : "";
	// Check for cancelling
	if(cancel) {
		value = "";
	} else {
		// Check if the popup is open by checking whether it matches "(<x>,<y>)"
	    var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/;
		if(popupLocationRegExp.test(value)) {
			value = "";
		} else {
			// Set the position if we're opening it
			value = "(" + this.domNode.offsetLeft + "," + this.domNode.offsetTop + "," + this.domNode.offsetWidth + "," + this.domNode.offsetHeight + ")";
		}
	}
	// Update the state tiddler
	this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: title, text: value}),true);
};

exports.handleEvent = function(event) {
	switch(event.type) {
		case "click":
			if(this.hasParameter("message")) {
				this.dispatchMessage(event);
			}
			if(this.hasParameter("popup")) {
				this.triggerPopup(event);
			}
			event.preventDefault();
			return false;
		case "tw-cancel-popup":
			if(this.hasParameter("popup") && event.targetOfCancel !== this.domNode) {
				this.triggerPopup(event,true);
			}
			break;
	}
	return true;
};

exports.executeMacro = function() {
	var attributes = {"class": ["tw-popup-controller"]};
	if(this.hasParameter("class")) {
		$tw.utils.pushTop(attributes["class"],this.params["class"].split(" "));
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
