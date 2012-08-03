/*\
title: $:/core/modules/macros/edit/editors/bitmapeditor.js
type: application/javascript
module-type: editor

An editor module for editting bitmaps

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function BitmapEditor(macroNode) {
	this.macroNode = macroNode;
}

BitmapEditor.prototype.getChild = function() {
	return $tw.Tree.Element("canvas",{
		"class": ["tw-edit-field"]
	},[],{
		events: ["touchstart","touchmove","touchend","mousedown","mousemove","mouseup"],
		eventHandler: this
	});
};

BitmapEditor.prototype.postRenderInDom = function() {
	var tiddler = this.macroNode.wiki.getTiddler(this.macroNode.editTiddler),
		canvas = this.macroNode.child.domNode,
		currImage = new Image();
/////////////////////	// Set the macro node itself to be position: relative
/////////////////////	this.macroNode.domNode.style.position = "relative";
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

BitmapEditor.prototype.handleEvent = function(event) {
	switch(event.type) {
		case "touchstart":
			this.brushDown = true;
			this.strokeStart(event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			event.stopPropagation();
			return false;
		case "touchmove":
			if(this.brushDown) {
				this.strokeMove(event.touches[0].clientX,event.touches[0].clientY);
			}
			event.preventDefault();
			event.stopPropagation();
			return false;
		case "touchend":
			if(this.brushDown) {
				this.brushDown = false;
				this.strokeEnd();
			}
			event.preventDefault();
			event.stopPropagation();
			return false;
		case "mousedown":
			this.strokeStart(event.clientX,event.clientY);
			this.brushDown = true;
			event.preventDefault();
			event.stopPropagation();
			return false;
		case "mousemove":
			if(this.brushDown) {
				this.strokeMove(event.clientX,event.clientY);
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
			return true;
		case "mouseup":
			if(this.brushDown) {
				this.brushDown = false;
				this.strokeEnd();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
			return true;
		}
	return true;
};

BitmapEditor.prototype.adjustCoordinates = function(x,y) {
	var canvas = this.macroNode.child.domNode,
		canvasRect = canvas.getBoundingClientRect(),
		scale = canvas.width/canvasRect.width;
	return {x: (x - canvasRect.left) * scale, y: (y - canvasRect.top) * scale};
};

BitmapEditor.prototype.strokeStart = function(x,y) {
	// Start off a new stroke
	this.stroke = [this.adjustCoordinates(x,y)];
};

BitmapEditor.prototype.strokeMove = function(x,y) {
	var canvas = this.macroNode.child.domNode,
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
	var canvas = this.macroNode.child.domNode,
		ctx = this.currCanvas.getContext("2d");
	ctx.drawImage(canvas,0,0);
	// Save the image into the tiddler
	this.saveChanges();
};

BitmapEditor.prototype.saveChanges = function() {
	var tiddler = this.macroNode.wiki.getTiddler(this.macroNode.editTiddler);
	if(tiddler) {
		// data URIs look like "data:<type>;base64,<text>"
		var dataURL = this.macroNode.child.domNode.toDataURL(tiddler.fields.type,1.0),
			posColon = dataURL.indexOf(":"),
			posSemiColon = dataURL.indexOf(";"),
			posComma = dataURL.indexOf(","),
			type = dataURL.substring(posColon+1,posSemiColon),
			text = dataURL.substring(posComma+1);
		var update = {type: type, text: text};
		this.macroNode.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

exports["image/jpg"] = BitmapEditor;
exports["image/jpeg"] = BitmapEditor;
exports["image/png"] = BitmapEditor;
exports["image/gif"] = BitmapEditor;

})();
