/*\
title: $:/core/modules/widgets/video.js
type: application/javascript
module-type: widget

Basic Video widget for displaying video files.
This is a simple implementation that can be overridden by plugins
for more advanced functionality.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VideoWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
VideoWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
VideoWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	
	// Create video element
	var videoElement = this.document.createElement("video");
	videoElement.setAttribute("controls", this.getAttribute("controls", "controls"));
	videoElement.setAttribute("style", this.getAttribute("style", "width: 100%; object-fit: contain"));
	videoElement.className = "tw-video-element";
		// Set source
	if(this.videoSource) {
		if (this.videoSource.indexOf("data:") === 0) {
			videoElement.setAttribute("src", this.videoSource);
		} else {
			var sourceElement = this.document.createElement("source");
			sourceElement.setAttribute("src", this.videoSource);
			if(this.videoType) {
				sourceElement.setAttribute("type", this.videoType);
			}
			videoElement.appendChild(sourceElement);
		}
	}
		// Insert the video into the DOM
	parent.insertBefore(videoElement, nextSibling);
	this.domNodes.push(videoElement);
};

/*
Compute the internal state of the widget
*/
VideoWidget.prototype.execute = function() {
	// Get the video source and type
	this.videoSource = this.getAttribute("src");
	this.videoType = this.getAttribute("type");
	this.videoControls = this.getAttribute("controls", "controls");
	
	// Make sure we have a tiddler for saving timestamps
	this.tiddlerTitle = this.getAttribute("tiddler");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
VideoWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.src || changedAttributes.type || changedAttributes.controls) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.video = VideoWidget;

})();
