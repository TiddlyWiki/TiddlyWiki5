/*\
title: $:/core/modules/widgets/edit-bitmap.js
type: application/javascript
module-type: widget

Edit-bitmap widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Default image sizes
var DEFAULT_IMAGE_WIDTH = 300,
	DEFAULT_IMAGE_HEIGHT = 185;

// Configuration tiddlers
var LINE_WIDTH_TITLE = "$:/config/BitmapEditor/LineWidth",
	LINE_COLOUR_TITLE = "$:/config/BitmapEditor/Colour";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditBitmapWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditBitmapWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditBitmapWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our element
	this.canvasDomNode = $tw.utils.domMaker("canvas",{
		document: this.document,
		"class":"tw-edit-bitmapeditor",
		eventListeners: [{
			name: "touchstart", handlerObject: this, handlerMethod: "handleTouchStartEvent"
		},{
			name: "touchmove", handlerObject: this, handlerMethod: "handleTouchMoveEvent"
		},{
			name: "touchend", handlerObject: this, handlerMethod: "handleTouchEndEvent"
		},{
			name: "mousedown", handlerObject: this, handlerMethod: "handleMouseDownEvent"
		},{
			name: "mousemove", handlerObject: this, handlerMethod: "handleMouseMoveEvent"
		},{
			name: "mouseup", handlerObject: this, handlerMethod: "handleMouseUpEvent"
		}]
	});
	this.widthDomNode = $tw.utils.domMaker("input",{
		document: this.document,
		"class":"tw-edit-bitmapeditor-width",
		eventListeners: [{
			name: "change", handlerObject: this, handlerMethod: "handleWidthChangeEvent"
		}]
	});
	this.heightDomNode = $tw.utils.domMaker("input",{
		document: this.document,
		"class":"tw-edit-bitmapeditor-height",
		eventListeners: [{
			name: "change", handlerObject: this, handlerMethod: "handleHeightChangeEvent"
		}]
	});
	// Insert the elements into the DOM
	parent.insertBefore(this.canvasDomNode,nextSibling);
	parent.insertBefore(this.widthDomNode,nextSibling);
	parent.insertBefore(this.heightDomNode,nextSibling);
	this.domNodes.push(this.canvasDomNode,this.widthDomNode,this.heightDomNode);
	// Load the image into the canvas
	this.loadCanvas();
};

/*
Compute the internal state of the widget
*/
EditBitmapWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
};

/*
Note that the bitmap editor intentionally doesn't try to refresh itself because it would be confusing to have the image changing spontaneously while editting it
*/
EditBitmapWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

EditBitmapWidget.prototype.loadCanvas = function() {
	var tiddler = this.wiki.getTiddler(this.editTitle),
		currImage = new Image();
	// Set up event handlers for loading the image
	var self = this;
	currImage.onload = function() {
		// Copy the image to the on-screen canvas
		self.initCanvas(self.canvasDomNode,currImage.width,currImage.height,currImage);
		// And also copy the current bitmap to the off-screen canvas
		self.currCanvas = self.document.createElement("canvas");
		self.initCanvas(self.currCanvas,currImage.width,currImage.height,currImage);
		// Set the width and height input boxes
		self.updateSize();
	};
	currImage.onerror = function() {
		// Set the on-screen canvas size and clear it
		self.initCanvas(self.canvasDomNode,DEFAULT_IMAGE_WIDTH,DEFAULT_IMAGE_HEIGHT);
		// Set the off-screen canvas size and clear it
		self.currCanvas = self.document.createElement("canvas");
		self.initCanvas(self.currCanvas,DEFAULT_IMAGE_WIDTH,DEFAULT_IMAGE_HEIGHT);
		// Set the width and height input boxes
		self.updateSize();
	}
	// Get the current bitmap into an image object
	currImage.src = "data:" + tiddler.fields.type + ";base64," + tiddler.fields.text;
};

EditBitmapWidget.prototype.initCanvas = function(canvas,width,height,image) {
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

/*
** Update the input boxes with the actual size of the canvas
*/
EditBitmapWidget.prototype.updateSize = function() {
	this.widthDomNode.value = this.currCanvas.width;
	this.heightDomNode.value = this.currCanvas.height;
};

/*
** Change the size of the canvas, preserving the current image
*/
EditBitmapWidget.prototype.changeCanvasSize = function(newWidth,newHeight) {
	// Create and size a new canvas
	var newCanvas = this.document.createElement("canvas");
	this.initCanvas(newCanvas,newWidth,newHeight);
	// Copy the old image
	var ctx = newCanvas.getContext("2d");
	ctx.drawImage(this.currCanvas,0,0);
	// Set the new canvas as the current one
	this.currCanvas = newCanvas;
	// Set the size of the onscreen canvas
	this.canvasDomNode.width = newWidth;
	this.canvasDomNode.height = newHeight;
	// Paint the onscreen canvas with the offscreen canvas
	ctx = this.canvasDomNode.getContext("2d");
	ctx.drawImage(this.currCanvas,0,0);
};

EditBitmapWidget.prototype.handleWidthChangeEvent = function(event) {
	// Get the new width
	var newWidth = parseInt(this.widthDomNode.value,10);
	// Update if necessary
	if(newWidth > 0 && newWidth !== this.currCanvas.width) {
		this.changeCanvasSize(newWidth,this.currCanvas.height);
	}
	// Update the input controls
	this.updateSize();
};

EditBitmapWidget.prototype.handleHeightChangeEvent = function(event) {
	// Get the new width
	var newHeight = parseInt(this.heightDomNode.value,10);
	// Update if necessary
	if(newHeight > 0 && newHeight !== this.currCanvas.height) {
		this.changeCanvasSize(this.currCanvas.width,newHeight);
	}
	// Update the input controls
	this.updateSize();
};

EditBitmapWidget.prototype.handleTouchStartEvent = function(event) {
	this.brushDown = true;
	this.strokeStart(event.touches[0].clientX,event.touches[0].clientY);
	event.preventDefault();
	event.stopPropagation();
	return false;
};

EditBitmapWidget.prototype.handleTouchMoveEvent = function(event) {
	if(this.brushDown) {
		this.strokeMove(event.touches[0].clientX,event.touches[0].clientY);
	}
	event.preventDefault();
	event.stopPropagation();
	return false;
};

EditBitmapWidget.prototype.handleTouchEndEvent = function(event) {
	if(this.brushDown) {
		this.brushDown = false;
		this.strokeEnd();
	}
	event.preventDefault();
	event.stopPropagation();
	return false;
};

EditBitmapWidget.prototype.handleMouseDownEvent = function(event) {
	this.strokeStart(event.clientX,event.clientY);
	this.brushDown = true;
	event.preventDefault();
	event.stopPropagation();
	return false;
};

EditBitmapWidget.prototype.handleMouseMoveEvent = function(event) {
	if(this.brushDown) {
		this.strokeMove(event.clientX,event.clientY);
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	return true;
};

EditBitmapWidget.prototype.handleMouseUpEvent = function(event) {
	if(this.brushDown) {
		this.brushDown = false;
		this.strokeEnd();
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	return true;
};

EditBitmapWidget.prototype.adjustCoordinates = function(x,y) {
	var canvasRect = this.canvasDomNode.getBoundingClientRect(),
		scale = this.canvasDomNode.width/canvasRect.width;
	return {x: (x - canvasRect.left) * scale, y: (y - canvasRect.top) * scale};
};

EditBitmapWidget.prototype.strokeStart = function(x,y) {
	// Start off a new stroke
	this.stroke = [this.adjustCoordinates(x,y)];
};

EditBitmapWidget.prototype.strokeMove = function(x,y) {
	var ctx = this.canvasDomNode.getContext("2d"),
		t;
	// Add the new position to the end of the stroke
	this.stroke.push(this.adjustCoordinates(x,y));
	// Redraw the previous image
	ctx.drawImage(this.currCanvas,0,0);
	// Render the stroke
	ctx.strokeStyle = this.wiki.getTiddlerText(LINE_COLOUR_TITLE,"#ff0");
	ctx.lineWidth = parseInt(this.wiki.getTiddlerText(LINE_WIDTH_TITLE,"3"),10);
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

EditBitmapWidget.prototype.strokeEnd = function() {
	// Copy the bitmap to the off-screen canvas
	var ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(this.canvasDomNode,0,0);
	// Save the image into the tiddler
	this.saveChanges();
};

EditBitmapWidget.prototype.saveChanges = function() {
	var tiddler = this.wiki.getTiddler(this.editTitle);
	if(tiddler) {
		// data URIs look like "data:<type>;base64,<text>"
		var dataURL = this.canvasDomNode.toDataURL(tiddler.fields.type,1.0),
			posColon = dataURL.indexOf(":"),
			posSemiColon = dataURL.indexOf(";"),
			posComma = dataURL.indexOf(","),
			type = dataURL.substring(posColon+1,posSemiColon),
			text = dataURL.substring(posComma+1);
		var update = {type: type, text: text};
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

exports["edit-bitmap"] = EditBitmapWidget;

})();
