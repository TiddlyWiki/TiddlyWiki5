/*\
title: $:/core/modules/macros/edit/editors/bitmapeditor.js
type: application/javascript
module-type: editor

An editor plugin for editting bitmaps

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function BitmapEditor(macroNode) {
	this.macroNode = macroNode;
}

BitmapEditor.prototype.getChildren = function() {
	return [$tw.Tree.Element("canvas",{
		"class": ["tw-edit-field"]
	},[])];
};

BitmapEditor.prototype.postRenderInDom = function() {
	var tiddler = this.macroNode.wiki.getTiddler(this.macroNode.tiddlerTitle),
		canvas = this.macroNode.children[0].domNode,
		currImage = new Image();
	// Set the macro node itself to be position: relative
	this.macroNode.domNode.style.position = "relative";
	// Get the current bitmap into an image object
	currImage.src = "data:" + tiddler.fields.type + ";base64," + tiddler.fields.text;
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
	var canvas = this.macroNode.children[0].domNode,
		canvasRect = canvas.getBoundingClientRect(),
		scale = canvas.width/canvasRect.width;
	return {x: (x - canvasRect.left) * scale, y: (y - canvasRect.top) * scale};
};

BitmapEditor.prototype.strokeStart = function(x,y) {
	// Start off a new stroke
	this.stroke = [this.adjustCoordinates(x,y)];
};

BitmapEditor.prototype.strokeMove = function(x,y) {
	var canvas = this.macroNode.children[0].domNode,
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
	var canvas = this.macroNode.children[0].domNode,
		ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(canvas,0,0);
	// Save the image into the tiddler
	this.saveChanges();
};

BitmapEditor.prototype.saveChanges = function() {
	var tiddler = this.macroNode.wiki.getTiddler(this.macroNode.tiddlerTitle);
	if(tiddler) {
		// data URIs look like "data:<type>;base64,<text>"
		var dataURL = this.macroNode.children[0].domNode.toDataURL(tiddler.fields.type,1.0),
			posColon = dataURL.indexOf(":"),
			posSemiColon = dataURL.indexOf(";"),
			posComma = dataURL.indexOf(","),
			type = dataURL.substring(posColon+1,posSemiColon),
			text = dataURL.substring(posComma+1);
		var update = {type: type, text: text};
		this.macroNode.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

BitmapEditor.prototype.isRefreshable = function() {
	// Don't ever refresh the bitmap editor
	return false;
};

exports["image/jpg"] = BitmapEditor;
exports["image/jpeg"] = BitmapEditor;
exports["image/png"] = BitmapEditor;
exports["image/gif"] = BitmapEditor;

})();
