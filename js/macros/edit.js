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

function BitmapEditor(macroNode) {
	this.macroNode = macroNode;
}

BitmapEditor.prototype.getContent = function() {
	return [Renderer.ElementNode("canvas",{},[])]
};

BitmapEditor.prototype.renderInDom = function() {
	var tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle),
		canvas = this.macroNode.content[0].domNode,
		img = new Image();
	this.macroNode.domNode.style.position = "relative";
	img.src = "data:" + tiddler.type + ";base64," + tiddler.text;
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(img,0,0);
};

BitmapEditor.prototype.addEventHandlers = function() {
	var self = this;
	this.macroNode.domNode.addEventListener("mousedown",function(event) {
			self.brushDown = true;
			event.stopPropagation();
			return false;
		},false);
	this.macroNode.domNode.addEventListener("mousemove",function(event) {
			if(self.brushDown) {
				self.moveTo(event.clientX,event.clientY);
				event.stopPropagation();
				return false;
			}
		},false);
	this.macroNode.domNode.addEventListener("mouseup",function(event) {
			if(self.brushDown) {
				self.brushDown = false;
				self.saveChanges();
				event.stopPropagation();
				return false;
			}
			return true;
		},false);
};

BitmapEditor.prototype.moveTo = function(x,y) {
	var canvas = this.macroNode.content[0].domNode,
		canvasRect = canvas.getBoundingClientRect(),
		ctx = canvas.getContext("2d");
	ctx.beginPath();
	ctx.arc(x - canvasRect.left,y - canvasRect.top,10,0,Math.PI*2,false);
	ctx.fill();
	ctx.closePath();
};

BitmapEditor.prototype.saveChanges = function() {
	var tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle);
	if(tiddler) {
		// data URIs look like "data:<type>;base64,<text>"
		var dataURL = this.macroNode.content[0].domNode.toDataURL(tiddler.type),
			posColon = dataURL.indexOf(":"),
			posSemiColon = dataURL.indexOf(";"),
			posComma = dataURL.indexOf(","),
			type = dataURL.substring(posColon+1,posSemiColon),
			text = dataURL.substring(posComma+1);
		var update = {type: type, text: text};
		this.macroNode.store.addTiddler(new Tiddler(tiddler,update));
	}
};

BitmapEditor.prototype.isRefreshable = function() {
	// Don't ever refresh the bitmap editor
	return false;
}

function TextEditor(macroNode) {
	this.macroNode = macroNode;
}

TextEditor.prototype.getContent = function() {
	var tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle),
		field = this.macroNode.hasParameter("field") ? this.macroNode.params.field : "title",
		value;
	if(tiddler) {
		value = tiddler[field];
	} else {
		switch(field) {
			case "text":
				value = "Type the text for the tiddler '" + this.macroNode.tiddlerTitle + "'";
				break;
			case "title":
				value = this.macroNode.tiddlerTitle;
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
	return [Renderer.ElementNode(type,attributes,[Renderer.TextNode(value)])];
};

TextEditor.prototype.getText = function(text,node) {
	if(node.nodeType === window.Node.TEXT_NODE) {
		text.push(node.data);
	} else if(node.nodeType === window.Node.ELEMENT_NODE && node.nodeName.toLowerCase() === "br") {
		// Firefox has `<br>` tags instead of line feeds
		text.push("\n");
	}
	if(node.hasChildNodes && node.hasChildNodes()) {
		for(var t=0; t<node.childNodes.length; t++) {
			this.getText(text,node.childNodes[t]);
		}
	}
};

TextEditor.prototype.addEventHandlers = function() {
	this.macroNode.domNode.addEventListener("DOMNodeInserted",this,false);
	this.macroNode.domNode.addEventListener("DOMNodeRemoved",this,false);
	this.macroNode.domNode.addEventListener("DOMCharacterDataModified",this,false);
};

TextEditor.prototype.handleEvent = function(event) {
	if(["DOMNodeInserted","DOMNodeRemoved","DOMCharacterDataModified"].indexOf(event.type) !== -1) {
		var tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle);
		if(this.macroNode.content[0].domNode && tiddler) {
			var text = [];
			this.getText(text,this.macroNode.content[0].domNode);
			text = text.join("");
			if(text !== tiddler[this.macroNode.params.field]) {
				var update = {};
				update[this.macroNode.params.field] = text;
				this.macroNode.store.addTiddler(new Tiddler(tiddler,update));
			}
			event.stopPropagation();
			return false;
		}
	}
	return true;
};

TextEditor.prototype.isRefreshable = function() {
	// Don't refresh the editor if it contains the caret or selection
	return !window.getSelection().containsNode(this.macroNode.domNode, true);
}

exports.macro = {
	name: "edit",
	dependentOnContextTiddler: true,
	params: {
		field: {byPos: 0, type: "text"}
	},
	execute: function() {
		// Get the tiddler being editted
		var tiddler = this.store.getTiddler(this.tiddlerTitle);
		// Figure out which editor to use
		var editor = TextEditor;
		if(this.params.field === "text") {
			if(["image/jpg","image/jpeg","image/png","image/gif"].indexOf(tiddler.type) !== -1) {
				editor = BitmapEditor;
			}
		}
		this.editor = new editor(this);
		var content = this.editor.getContent();
		for(var t=0; t<content.length; t++) {
			content[t].execute(this.parents,this.tiddlerTitle);
		}
		return content;
	},
	addEventHandlers: function() {
		if(this.editor.addEventHandlers) {
			this.editor.addEventHandlers();
		}
	},
	renderInDom: function() {
		if(this.editor.renderInDom) {
			this.editor.renderInDom();
		}
	},
	refreshInDom: function(changes) {
		// Only refresh if a dependency is triggered
		if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
			// Only refresh if the editor lets us
			if(this.editor.isRefreshable()) {
				// Remove the event handlers so they don't get triggered by the following DOM manipulations
				for(var e in exports.macro.events) {
					this.domNode.removeEventListener(e,this,false);
				}
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

