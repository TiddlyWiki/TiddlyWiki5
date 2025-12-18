/*\
title: $:/core/modules/editor/operations/bitmap/resize.js
type: application/javascript
module-type: bitmapeditoroperation

Bitmap editor operation to resize the image

\*/

"use strict";

exports["resize"] = function(event) {
	// Get the new width
	var newWidth = parseInt(event.paramObject.width || this.canvasDomNode.width,10),
		newHeight = parseInt(event.paramObject.height || this.canvasDomNode.height,10);
	// Update if necessary
	if(newWidth > 0 && newHeight > 0 && !(newWidth === this.currCanvas.width && newHeight === this.currCanvas.height)) {
		this.changeCanvasSize(newWidth,newHeight);
	}
	// Update the input controls
	this.refreshToolbar();
	// Save the image into the tiddler
	this.saveChanges();
};
