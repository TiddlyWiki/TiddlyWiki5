/*\
title: $:/core/modules/macros/linkcatcher.js
type: application/javascript
module-type: macro

Catches attempts to navigate to links and puts the name of the link into a specified TextReference

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "linkcatcher",
	params: {
		store: {byName: "default", type: "tiddler"}
	}
};

exports.handleEvent = function(event) {
	if(event.type === "tw-navigate") {
		this.wiki.setTextReference(this.params.store,event.navigateTo);
		event.stopPropagation();
		return false;
	}
	return true;
};

exports.executeMacro = function() {
	var attributes = {};
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("div",attributes,this.content,{
		events: ["tw-navigate"],
		eventHandler: this
	});
};

})();
