/*\
title: $:/core/modules/editor/operations/bitmap/rotate-left.js
type: application/javascript
module-type: bitmapeditoroperation

Bitmap editor operation to rotate the image left by 90 degrees

\*/

"use strict";

exports["rotate-left"] = function(event) {
	// Rotate the canvas left by 90 degrees
	this.rotateCanvasLeft();
	// Update the input controls
	this.refreshToolbar();
	// Save the image into the tiddler
	this.saveChanges();
};
