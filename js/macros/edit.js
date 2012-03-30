/*\
title: js/macros/edit.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var Tiddler = require("../Tiddler.js").Tiddler,
	Renderer = require("../Renderer.js").Renderer,
	Dependencies = require("../Dependencies.js").Dependencies,
	utils = require("../Utils.js");

function getText(text,node) {
	if(node.nodeType === window.Node.TEXT_NODE) {
		text.push(node.data);
	} else if(node.nodeType === window.Node.ELEMENT_NODE && node.nodeName.toLowerCase() === "br") {
		// Firefox has `<br>` tags instead of line feeds
		text.push("\n");
	}
	if(node.hasChildNodes && node.hasChildNodes()) {
		for(var t=0; t<node.childNodes.length; t++) {
			getText(text,node.childNodes[t]);
		}
	}
}

function handleTextChangeEvent(macroNode,event) {
	var tiddler = macroNode.store.getTiddler(macroNode.tiddlerTitle);
	if(macroNode.content[0].domNode && tiddler) {
		var text = [];
		getText(text,macroNode.content[0].domNode);
		text = text.join("");
		if(text !== tiddler[macroNode.params.field]) {
			var update = {};
			update[macroNode.params.field] = text;
			macroNode.store.addTiddler(new Tiddler(tiddler,update));
		}
		event.stopPropagation();
		return false;
	}
}

exports.macro = {
	name: "edit",
	dependentOnContextTiddler: true,
	params: {
		field: {byPos: 0, type: "text"}
	},
	events: {
		"DOMNodeInserted": function(event) {
			return handleTextChangeEvent(this,event);
		},
		"DOMNodeRemoved": function(event) {
			return handleTextChangeEvent(this,event);
		},
		"DOMCharacterDataModified": function(event) {
			return handleTextChangeEvent(this,event);
		}
	},
	execute: function() {
		var tiddler = this.store.getTiddler(this.tiddlerTitle),
			field = this.hasParameter("field") ? this.params.field : "title",
			value;
		if(tiddler) {
			value = tiddler[field];
		} else {
			switch(field) {
				case "text":
					value = "Type the text for the tiddler '" + this.tiddlerTitle + "'";
					break;
				case "title":
					value = this.tiddlerTitle;
					break;
				default:
					value = "";
					break;
			}
		}
		var type = "div";
		if(field === "text") {
			type = "pre";
		}
		var attributes = {
			"contenteditable": true,
			"class": ["tw-edit-field"]
		};
		var editor = Renderer.ElementNode(type,attributes,[Renderer.TextNode(value)]);
		editor.execute(this.parents,this.tiddlerTitle);
		return [editor];
	},
	refreshInDom: function(changes) {
		if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
			// Don't refresh the editor if it contains the caret or selection
			if(!window.getSelection().containsNode(this.domNode, true)) {
				// Remove the previous content
				while(this.domNode.hasChildNodes()) {
					this.domNode.removeChild(this.domNode.firstChild);
				}
				// Execute the new content
				this.execute(this.parents,this.tiddlerTitle);
				// Render to the DOM
				for(var t=0; t<this.content.length; t++) {
					this.content[t].renderInDom(this.domNode);
				}
			}
		}
	}
};

})();

