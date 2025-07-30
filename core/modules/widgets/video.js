/*\
title: $:/core/modules/widgets/video.js
type: application/javascript
module-type: widget

Basic Video widget for displaying video files.
This is a simple implementation that can be overridden by plugins
for more advanced functionality.

\*/

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
    
    // Try to get from tiddler attribute
    if(!this.videoSource && this.getAttribute("tiddler")) {
        var tiddlerTitle = this.getAttribute("tiddler");
        var tiddler = this.wiki.getTiddler(tiddlerTitle);
        if(tiddler) {
            if(tiddler.fields._canonical_uri) {
                this.videoSource = tiddler.fields._canonical_uri;
                this.videoType = tiddler.fields.type;
            } else if(tiddler.fields.text) {
                this.videoSource = "data:" + tiddler.fields.type + ";base64," + tiddler.fields.text;
                this.videoType = tiddler.fields.type;
            }
        }
    }
    
    // Make sure we have a tiddler for saving timestamps
    this.tiddlerTitle = this.getAttribute("tiddler");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
VideoWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.src || changedAttributes.type || changedAttributes.controls || changedAttributes.tiddler) {
        this.refreshSelf();
        return true;
    } else {
        return false;
    }
};

exports["video"] = VideoWidget;

