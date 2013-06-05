/*\
title: $:/core/modules/widgets/edit/editors/bitmapeditor.js
type: application/javascript
module-type: editor

A bitmap editor

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_IMAGE_WIDTH = 300,
	DEFAULT_IMAGE_HEIGHT = 182;

var BitmapEditor = function(editWidget,tiddlerTitle,fieldName) {
	this.editWidget = editWidget;
	this.tiddlerTitle = tiddlerTitle;
	this.fieldName = fieldName;
};

BitmapEditor.prototype.render = function() {
	// Set the element details
	this.editWidget.tag = "canvas";
	this.editWidget.attributes = {
		"class": "tw-edit-bitmapeditor"
	};
	this.editWidget.events = [
		{name: "touchstart", handlerObject: this, handlerMethod: "handleTouchStartEvent"},
		{name: "touchmove", handlerObject: this, handlerMethod: "handleTouchMoveEvent"},
		{name: "touchend", handlerObject: this, handlerMethod: "handleTouchEndEvent"},
		{name: "mousedown", handlerObject: this, handlerMethod: "handleMouseDownEvent"},
		{name: "mousemove", handlerObject: this, handlerMethod: "handleMouseMoveEvent"},
		{name: "mouseup", handlerObject: this, handlerMethod: "handleMouseUpEvent"}
	];
};

BitmapEditor.prototype.postRenderInDom = function() {
	var tiddler = this.editWidget.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		canvas = this.editWidget.renderer.domNode,
		currImage = new Image();
	// Set up event handlers for loading the image
	var self = this;
	currImage.onload = function() {
		// Copy the image to the on-screen canvas
		self.initCanvas(canvas,currImage.width,currImage.height,currImage);
		// And also copy the current bitmap to the off-screen canvas
		self.currCanvas = self.editWidget.renderer.renderTree.document.createElement("canvas");
		self.initCanvas(self.currCanvas,currImage.width,currImage.height,currImage);
	};
	currImage.onerror = function() {
		// Set the on-screen canvas size and clear it
		self.initCanvas(canvas,DEFAULT_IMAGE_WIDTH,DEFAULT_IMAGE_HEIGHT);
		// Set the off-screen canvas size and clear it
		self.currCanvas = self.editWidget.renderer.renderTree.document.createElement("canvas");
		self.initCanvas(self.currCanvas,DEFAULT_IMAGE_WIDTH,DEFAULT_IMAGE_HEIGHT);
	}
	// Get the current bitmap into an image object
	currImage.src = "data:" + tiddler.fields.type + ";base64," + tiddler.fields.text;
};

BitmapEditor.prototype.initCanvas = function(canvas,width,height,image) {
	canvas.width = width;
	canvas.height = height;
	var ctx = canvas.getContext("2d");
	if(image) {
		ctx.drawImage(image,0,0);
	} else {
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
	}
}

BitmapEditor.prototype.handleTouchStartEvent = function(event) {
	this.brushDown = true;
	this.strokeStart(event.touches[0].clientX,event.touches[0].clientY);
	event.preventDefault();
	event.stopPropagation();
	return false;
};

BitmapEditor.prototype.handleTouchMoveEvent = function(event) {
	if(this.brushDown) {
		this.strokeMove(event.touches[0].clientX,event.touches[0].clientY);
	}
	event.preventDefault();
	event.stopPropagation();
	return false;
};

BitmapEditor.prototype.handleTouchEndEvent = function(event) {
	if(this.brushDown) {
		this.brushDown = false;
		this.strokeEnd();
	}
	event.preventDefault();
	event.stopPropagation();
	return false;
};

BitmapEditor.prototype.handleMouseDownEvent = function(event) {
	this.strokeStart(event.clientX,event.clientY);
	this.brushDown = true;
	event.preventDefault();
	event.stopPropagation();
	return false;
};

BitmapEditor.prototype.handleMouseMoveEvent = function(event) {
	if(this.brushDown) {
		this.strokeMove(event.clientX,event.clientY);
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	return true;
};

BitmapEditor.prototype.handleMouseUpEvent = function(event) {
	if(this.brushDown) {
		this.brushDown = false;
		this.strokeEnd();
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	return true;
};

BitmapEditor.prototype.adjustCoordinates = function(x,y) {
	var canvas = this.editWidget.renderer.domNode,
		canvasRect = canvas.getBoundingClientRect(),
		scale = canvas.width/canvasRect.width;
	return {x: (x - canvasRect.left) * scale, y: (y - canvasRect.top) * scale};
};

BitmapEditor.prototype.strokeStart = function(x,y) {
	// Start off a new stroke
	this.stroke = [this.adjustCoordinates(x,y)];
};

BitmapEditor.prototype.strokeMove = function(x,y) {
	var canvas = this.editWidget.renderer.domNode,
		ctx = canvas.getContext("2d"),
		t;
	// Add the new position to the end of the stroke
	this.stroke.push(this.adjustCoordinates(x,y));
	// Redraw the previous image
	ctx.drawImage(this.currCanvas,0,0);
	// Render the stroke
	ctx.strokeStyle = "#ff0";
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
	var canvas = this.editWidget.renderer.domNode,
		ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(canvas,0,0);
	// Save the image into the tiddler
	this.saveChanges();
};

BitmapEditor.prototype.saveChanges = function() {
	var tiddler = this.editWidget.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler) {
		// data URIs look like "data:<type>;base64,<text>"
		var dataURL = this.editWidget.renderer.domNode.toDataURL(tiddler.fields.type,1.0),
			posColon = dataURL.indexOf(":"),
			posSemiColon = dataURL.indexOf(";"),
			posComma = dataURL.indexOf(","),
			type = dataURL.substring(posColon+1,posSemiColon),
			text = dataURL.substring(posComma+1);
		var update = {type: type, text: text};
		this.editWidget.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

/*
Note that the bitmap editor intentionally doesn't have a refreshInDom method to avoid the situation where a bitmap being editted is modified externally
*/

exports["image/jpg"] = BitmapEditor;
exports["image/jpeg"] = BitmapEditor;
exports["image/png"] = BitmapEditor;
exports["image/gif"] = BitmapEditor;

})();
