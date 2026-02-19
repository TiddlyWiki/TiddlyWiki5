/*\
title: $:/core/modules/widgets/audio.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var AudioWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

AudioWidget.prototype = new Widget();

AudioWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	// Create audio element
	var audioElement = this.document.createElement("audio");
	audioElement.setAttribute("controls", this.getAttribute("controls", "controls"));
	audioElement.setAttribute("style", this.getAttribute("style", "width: 100%; object-fit: contain"));
	audioElement.className = "tw-audio-element";

	// Set source
	if(this.audioSource) {
		if (this.audioSource.indexOf("data:") === 0) {
			audioElement.setAttribute("src", this.audioSource);
		} else {
			var sourceElement = this.document.createElement("source");
			sourceElement.setAttribute("src", this.audioSource);
			if(this.audioType) {
				sourceElement.setAttribute("type", this.audioType);
			}
			audioElement.appendChild(sourceElement);
		}
	}

	parent.insertBefore(audioElement, nextSibling);
	this.domNodes.push(audioElement);
};

AudioWidget.prototype.execute = function() {
	// Get the audio source and type
	this.audioSource = this.getAttribute("src");
	this.audioType = this.getAttribute("type");
	this.audioControls = this.getAttribute("controls", "controls");

	// Try to get from tiddler attribute
	if(!this.audioSource && this.getAttribute("tiddler")) {
		var tiddlerTitle = this.getAttribute("tiddler");
		var tiddler = this.wiki.getTiddler(tiddlerTitle);
		if(tiddler) {
			if(tiddler.fields._canonical_uri) {
				this.audioSource = tiddler.fields._canonical_uri;
				this.audioType = tiddler.fields.type;
			} else if(tiddler.fields.text) {
				this.audioSource = "data:" + tiddler.fields.type + ";base64," + tiddler.fields.text;
				this.audioType = tiddler.fields.type;
			}
		}
	}

	this.tiddlerTitle = this.getAttribute("tiddler");
};

AudioWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.src || changedAttributes.type || changedAttributes.controls || changedAttributes.tiddler) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.audio = AudioWidget;
