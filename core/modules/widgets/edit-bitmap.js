/*\
title: $:/core/modules/widgets/edit-bitmap.js
type: application/javascript
module-type: widget

Edit-bitmap widget

\*/

"use strict";

// Default image sizes
const DEFAULT_IMAGE_WIDTH = 600;
const DEFAULT_IMAGE_HEIGHT = 370;
const DEFAULT_IMAGE_TYPE = "image/png";

// Configuration tiddlers
const LINE_WIDTH_TITLE = "$:/config/BitmapEditor/LineWidth";
const LINE_COLOUR_TITLE = "$:/config/BitmapEditor/Colour";
const LINE_OPACITY_TITLE = "$:/config/BitmapEditor/Opacity";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const EditBitmapWidget = function(parseTreeNode,options) {
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
	const self = this;
	// Initialise the editor operations if they've not been done already
	if(!this.editorOperations) {
		EditBitmapWidget.prototype.editorOperations = {};
		$tw.modules.applyMethods("bitmapeditoroperation",this.editorOperations);
	}
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create the wrapper for the toolbar and render its content
	this.toolbarNode = this.document.createElement("div");
	this.toolbarNode.className = "tc-editor-toolbar";
	parent.insertBefore(this.toolbarNode,nextSibling);
	this.domNodes.push(this.toolbarNode);
	// Create the on-screen canvas
	this.canvasDomNode = $tw.utils.domMaker("canvas",{
		document: this.document,
		"class": "tc-edit-bitmapeditor",
		eventListeners: [{
			name: "touchstart",handlerObject: this,handlerMethod: "handleTouchStartEvent"
		},{
			name: "touchmove",handlerObject: this,handlerMethod: "handleTouchMoveEvent"
		},{
			name: "touchend",handlerObject: this,handlerMethod: "handleTouchEndEvent"
		},{
			name: "mousedown",handlerObject: this,handlerMethod: "handleMouseDownEvent"
		},{
			name: "mousemove",handlerObject: this,handlerMethod: "handleMouseMoveEvent"
		},{
			name: "mouseup",handlerObject: this,handlerMethod: "handleMouseUpEvent"
		}]
	});
	// Set the width and height variables
	this.setVariable("tv-bitmap-editor-width",`${this.canvasDomNode.width}px`);
	this.setVariable("tv-bitmap-editor-height",`${this.canvasDomNode.height}px`);
	// Render toolbar child widgets
	this.renderChildren(this.toolbarNode,null);
	// // Insert the elements into the DOM
	parent.insertBefore(this.canvasDomNode,nextSibling);
	this.domNodes.push(this.canvasDomNode);
	// Load the image into the canvas
	if($tw.browser) {
		this.loadCanvas();
	}
	// Add widget message listeners
	this.addEventListeners([
		{type: "tm-edit-bitmap-operation",handler: "handleEditBitmapOperationMessage"}
	]);
};

/*
Handle an edit bitmap operation message from the toolbar
*/
EditBitmapWidget.prototype.handleEditBitmapOperationMessage = function(event) {
	// Invoke the handler
	const handler = this.editorOperations[event.param];
	if(handler) {
		handler.call(this,event);
	}
};

/*
Compute the internal state of the widget
*/
EditBitmapWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Just refresh the toolbar
*/
EditBitmapWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Set the bitmap size variables and refresh the toolbar
*/
EditBitmapWidget.prototype.refreshToolbar = function() {
	// Set the width and height variables
	this.setVariable("tv-bitmap-editor-width",`${this.canvasDomNode.width}px`);
	this.setVariable("tv-bitmap-editor-height",`${this.canvasDomNode.height}px`);
	// Refresh each of our child widgets
	$tw.utils.each(this.children,(childWidget) => {
		childWidget.refreshSelf();
	});
};

EditBitmapWidget.prototype.loadCanvas = function() {
	const tiddler = this.wiki.getTiddler(this.editTitle);
	const currImage = new Image();
	// Set up event handlers for loading the image
	const self = this;
	currImage.onload = function() {
		// Copy the image to the on-screen canvas
		self.initCanvas(self.canvasDomNode,currImage.width,currImage.height,currImage);
		// And also copy the current bitmap to the off-screen canvas
		self.currCanvas = self.document.createElement("canvas");
		self.initCanvas(self.currCanvas,currImage.width,currImage.height,currImage);
		// Set the width and height input boxes
		self.refreshToolbar();
	};
	currImage.onerror = function() {
		// Set the on-screen canvas size and clear it
		self.initCanvas(self.canvasDomNode,DEFAULT_IMAGE_WIDTH,DEFAULT_IMAGE_HEIGHT);
		// Set the off-screen canvas size and clear it
		self.currCanvas = self.document.createElement("canvas");
		self.initCanvas(self.currCanvas,DEFAULT_IMAGE_WIDTH,DEFAULT_IMAGE_HEIGHT);
		// Set the width and height input boxes
		self.refreshToolbar();
	};
	// Get the current bitmap into an image object
	if(tiddler && tiddler.fields.type && tiddler.fields.text) {
		currImage.src = `data:${tiddler.fields.type};base64,${tiddler.fields.text}`;
	} else {
		currImage.width = DEFAULT_IMAGE_WIDTH;
		currImage.height = DEFAULT_IMAGE_HEIGHT;
		currImage.onerror();
	}
};

EditBitmapWidget.prototype.initCanvas = function(canvas,width,height,image) {
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if(image) {
		ctx.drawImage(image,0,0);
	} else {
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,canvas.width,canvas.height);
	}
};

/*
** Change the size of the canvas, preserving the current image
*/
EditBitmapWidget.prototype.changeCanvasSize = function(newWidth,newHeight) {
	// Create and size a new canvas
	const newCanvas = this.document.createElement("canvas");
	this.initCanvas(newCanvas,newWidth,newHeight);
	// Copy the old image
	let ctx = newCanvas.getContext("2d");
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

/*
** Rotate the canvas left by 90 degrees
*/
EditBitmapWidget.prototype.rotateCanvasLeft = function() {
	// Get the current size of the image
	const origWidth = this.currCanvas.width;
	const origHeight = this.currCanvas.height;
	// Create and size a new canvas
	const newCanvas = this.document.createElement("canvas");
	const newWidth = origHeight;
	const newHeight = origWidth;
	this.initCanvas(newCanvas,newWidth,newHeight);
	// Copy the old image
	let ctx = newCanvas.getContext("2d");
	ctx.save();
	ctx.translate(newWidth / 2,newHeight / 2);
	ctx.rotate(-Math.PI / 2);
	ctx.drawImage(this.currCanvas,-origWidth / 2,-origHeight / 2);
	ctx.restore();
	// Set the new canvas as the current one
	this.currCanvas = newCanvas;
	// Set the size of the onscreen canvas
	this.canvasDomNode.width = newWidth;
	this.canvasDomNode.height = newHeight;
	// Paint the onscreen canvas with the offscreen canvas
	ctx = this.canvasDomNode.getContext("2d");
	ctx.drawImage(this.currCanvas,0,0);
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
	const canvasRect = this.canvasDomNode.getBoundingClientRect();
	const scale = this.canvasDomNode.width / canvasRect.width;
	return {x: (x - canvasRect.left) * scale,y: (y - canvasRect.top) * scale};
};

EditBitmapWidget.prototype.strokeStart = function(x,y) {
	// Start off a new stroke
	this.stroke = [this.adjustCoordinates(x,y)];
};

EditBitmapWidget.prototype.strokeMove = function(x,y) {
	const ctx = this.canvasDomNode.getContext("2d");
	let t;
	// Add the new position to the end of the stroke
	this.stroke.push(this.adjustCoordinates(x,y));
	// Redraw the previous image
	ctx.drawImage(this.currCanvas,0,0);
	// Render the stroke
	ctx.globalAlpha = parseFloat(this.wiki.getTiddlerText(LINE_OPACITY_TITLE,"1.0"));
	ctx.strokeStyle = this.wiki.getTiddlerText(LINE_COLOUR_TITLE,"#ff0");
	ctx.lineWidth = parseFloat(this.wiki.getTiddlerText(LINE_WIDTH_TITLE,"3"));
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.beginPath();
	ctx.moveTo(this.stroke[0].x,this.stroke[0].y);
	for(t = 1;t < this.stroke.length - 1;t++) {
		const s1 = this.stroke[t];
		const s2 = this.stroke[t - 1];
		const tx = (s1.x + s2.x) / 2;
		const ty = (s1.y + s2.y) / 2;
		ctx.quadraticCurveTo(s2.x,s2.y,tx,ty);
	}
	ctx.stroke();
};

EditBitmapWidget.prototype.strokeEnd = function() {
	// Copy the bitmap to the off-screen canvas
	const ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(this.canvasDomNode,0,0);
	// Save the image into the tiddler
	this.saveChanges();
};

EditBitmapWidget.prototype.saveChanges = function() {
	const tiddler = this.wiki.getTiddler(this.editTitle) || new $tw.Tiddler({title: this.editTitle,type: DEFAULT_IMAGE_TYPE});
	// data URIs look like "data:<type>;base64,<text>"
	const dataURL = this.canvasDomNode.toDataURL(tiddler.fields.type);
	const posColon = dataURL.indexOf(":");
	const posSemiColon = dataURL.indexOf(";");
	const posComma = dataURL.indexOf(",");
	const type = dataURL.substring(posColon + 1,posSemiColon);
	const text = dataURL.substring(posComma + 1);
	const update = {type,text};
	this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getModificationFields(),tiddler,update,this.wiki.getCreationFields()));
};

exports["edit-bitmap"] = EditBitmapWidget;
