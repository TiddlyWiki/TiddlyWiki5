/*\
title: $:/core/modules/editor/operations/bitmap/clear.js
type: application/javascript
module-type: bitmapeditoroperation

Bitmap editor operation to clear the image

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["clear"] = function(event) {
	var ctx = this.canvasDomNode.getContext("2d");
	ctx.globalAlpha = 1;
	ctx.fillStyle = event.paramObject.colour || "white";
	ctx.fillRect(0,0,this.canvasDomNode.width,this.canvasDomNode.height);
	// Save changes
	this.strokeEnd();
};

})();
