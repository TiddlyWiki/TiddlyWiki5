/*\
title: js/macros/command.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

exports.macro = {
	name: "command",
	params: {
		name: {byName: "default", type: "text"},
		label: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	},
	events: {
		"click": function(event) {
			var commandEvent = document.createEvent("Event");
			commandEvent.initEvent("tw-" + this.params.name,true,true);
			commandEvent.tiddlerTitle = this.tiddlerTitle;
			commandEvent.commandOrigin = this;
			event.target.dispatchEvent(commandEvent); 
			event.preventDefault();
			return false;
		}
	},
	execute: function() {
		var attributes = {};
		if(this.hasParameter("class")) {
			attributes["class"] = this.params.class.split(" ");
		}
		return [Renderer.ElementNode("button",attributes,[Renderer.TextNode(this.params.label)])]
	}
};

})();
