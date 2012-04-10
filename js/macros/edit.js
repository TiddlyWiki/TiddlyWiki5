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
	return [Renderer.ElementNode("canvas",{
		"class": ["tw-edit-field"]
	},[])];
};

BitmapEditor.prototype.renderInDom = function() {
	var tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle),
		canvas = this.macroNode.content[0].domNode,
		currImage = new Image();
	// Set the macro node itself to be position: relative
	this.macroNode.domNode.style.position = "relative";
	// Get the current bitmap into an image object
	currImage.src = "data:" + tiddler.type + ";base64," + tiddler.text;
	// Copy it to the on-screen canvas
	canvas.width = currImage.width;
	canvas.height = currImage.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(currImage,0,0);
	// And also copy the current bitmap to the off-screen canvas
	this.currCanvas = document.createElement("canvas");
	this.currCanvas.width = currImage.width;
	this.currCanvas.height = currImage.height;
	ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(currImage,0,0);
};

BitmapEditor.prototype.addEventHandlers = function() {
	var self = this;
	this.macroNode.domNode.addEventListener("touchstart",function(event) {
			self.brushDown = true;
			self.strokeStart(event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			event.stopPropagation();
			return false;
		},false);
	this.macroNode.domNode.addEventListener("touchmove",function(event) {
			if(self.brushDown) {
				self.strokeMove(event.touches[0].clientX,event.touches[0].clientY);
			}
			event.preventDefault();
			event.stopPropagation();
			return false;
		},false);
	this.macroNode.domNode.addEventListener("touchend",function(event) {
			if(self.brushDown) {
				self.brushDown = false;
				self.strokeEnd();
			}
			event.preventDefault();
			event.stopPropagation();
			return false;
		},false);
	this.macroNode.domNode.addEventListener("mousedown",function(event) {
			self.strokeStart(event.clientX,event.clientY);
			self.brushDown = true;
			event.preventDefault();
			event.stopPropagation();
			return false;
		},false);
	this.macroNode.domNode.addEventListener("mousemove",function(event) {
			if(self.brushDown) {
				self.strokeMove(event.clientX,event.clientY);
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		},false);
	this.macroNode.domNode.addEventListener("mouseup",function(event) {
			if(self.brushDown) {
				self.brushDown = false;
				self.strokeEnd();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
			return true;
		},false);
};

BitmapEditor.prototype.adjustCoordinates = function(x,y) {
	var canvas = this.macroNode.content[0].domNode,
		canvasRect = canvas.getBoundingClientRect(),
		scale = canvas.width/canvasRect.width;
	return {x: (x - canvasRect.left) * scale, y: (y - canvasRect.top) * scale};
};

BitmapEditor.prototype.strokeStart = function(x,y) {
	// Start off a new stroke
	this.stroke = [this.adjustCoordinates(x,y)];
};

BitmapEditor.prototype.strokeMove = function(x,y) {
	var canvas = this.macroNode.content[0].domNode,
		ctx = canvas.getContext("2d"),
		t;
	// Add the new position to the end of the stroke
	this.stroke.push(this.adjustCoordinates(x,y));
	// Redraw the previous image
	ctx.drawImage(this.currCanvas,0,0);
	// Render the stroke
	ctx.lineWidth = 3;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.beginPath();
	ctx.moveTo(this.stroke[0].x,this.stroke[0].y);
	for(t=1; t<this.stroke.length-1; t++) {
		var s1 = this.stroke[t],
			s2 = this.stroke[t-1],
			tx = (s1.x + s2.x)/2,
			ty = (s1.y + s2.y)/2;
		ctx.quadraticCurveTo(s2.x,s2.y,tx,ty);
	}
	ctx.stroke();
};

BitmapEditor.prototype.strokeEnd = function() {
	// Copy the bitmap to the off-screen canvas
	var canvas = this.macroNode.content[0].domNode,
		ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(canvas,0,0);
	// Save the image into the tiddler
	this.saveChanges();
};

BitmapEditor.prototype.saveChanges = function() {
	var tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle);
	if(tiddler) {
		// data URIs look like "data:<type>;base64,<text>"
		var dataURL = this.macroNode.content[0].domNode.toDataURL(tiddler.type,0.95),
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
};

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
	var attributes = {
			"class": ["tw-edit-field"]
		},
		tagName,
		content = [];
	if(field === "text") {
		tagName = "textarea";
		content.push(Renderer.TextNode(value));
	} else {
		tagName = "input";
		attributes.type = "text";
		attributes.value = value;
	}
	return [Renderer.ElementNode(tagName,attributes,content)];
};

TextEditor.prototype.addEventHandlers = function() {
	this.macroNode.domNode.addEventListener("focus",this,false);
	this.macroNode.domNode.addEventListener("keyup",this,false);
};

TextEditor.prototype.handleEvent = function(event) {
	// Get the value of the field if it might have changed
	if("keyup".split(" ").indexOf(event.type) !== -1) {
		this.saveChanges();
	}
	// Whatever the event, fix the height of the textarea if required
	var self = this;
	window.setTimeout(function() {
		self.fixHeight();
	},5);
	return true;
};

TextEditor.prototype.saveChanges = function() {
	var text = this.macroNode.content[0].domNode.value,
		tiddler = this.macroNode.store.getTiddler(this.macroNode.tiddlerTitle);
	if(tiddler && text !== tiddler[this.macroNode.params.field]) {
		var update = {};
		update[this.macroNode.params.field] = text;
		this.macroNode.store.addTiddler(new Tiddler(tiddler,update));
	}
};

TextEditor.prototype.fixHeight = function() {
	if(this.macroNode.content[0] && this.macroNode.content[0].domNode) {
		var wrapper = this.macroNode.domNode,
			textarea = this.macroNode.content[0].domNode;
		// Set the text area height to 1px temporarily, which allows us to read the true scrollHeight
		var prevWrapperHeight = wrapper.style.height;
		wrapper.style.height = textarea.style.height + "px";
		textarea.style.overflow = "hidden";
		textarea.style.height = "1px";
		textarea.style.height = textarea.scrollHeight + "px";
		wrapper.style.height = prevWrapperHeight;
	}
};

TextEditor.prototype.renderInDom = function() {
	this.fixHeight();
};

TextEditor.prototype.isRefreshable = function() {
	// Don't refresh the editor if it contains the caret or selection
	return !window.getSelection().containsNode(this.macroNode.domNode, true);
};

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
		var Editor = TextEditor;
		if(this.params.field === "text") {
			if(["image/jpg","image/jpeg","image/png","image/gif"].indexOf(tiddler.type) !== -1) {
				Editor = BitmapEditor;
			}
		}
		this.editor = new Editor(this);
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
		var t;
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
				for(t=0; t<this.content.length; t++) {
					this.content[t].renderInDom(this.domNode);
				}
			}
		} else {
			// Refresh any children
			for(t=0; t<this.content.length; t++) {
				this.content[t].refreshInDom(changes);
			}
		}
	}
};

})();

