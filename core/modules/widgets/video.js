/*\
title: $:/core/modules/widget/video.js
type: application/javascript
module-type: widget

Implements the video widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var VideoWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

VideoWidget.prototype.generate = function() {
	// Get attributes
	this.src = this.renderer.getAttribute("src");
	this.type = this.renderer.getAttribute("type","vimeo");
	this.width = parseInt(this.renderer.getAttribute("width","640"),10);
	this.height = parseInt(this.renderer.getAttribute("height","360"),10);
	// Return the appropriate element
	switch(this.type) {
		case "vimeo":
			this.tag = "iframe";
			this.attributes = {
				src: "http://player.vimeo.com/video/" + this.src + "?autoplay=0",
				width: this.width,
				height: this.height,
				frameborder: 0
			};
			break;
		case "youtube":
			this.tag = "iframe";
			this.attributes = {
				src: "http://www.youtube.com/embed/" + this.src,
				width: this.width,
				height: this.height,
				frameborder: 0
			};
			break;
		case "archiveorg":
			this.tag = "iframe";
			this.attributes = {
				src: "http://www.archive.org/embed/" + this.src,
				width: this.width,
				height: this.height,
				frameborder: 0
			};
			break;
		default:
			this.tag = "div";
			this.attributes = {};
			this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
				type: "text",
				text: "Unknown video type"
			}]);
			break;
	}
};

exports.video = VideoWidget;

})();
