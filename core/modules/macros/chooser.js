/*\
title: $:/core/modules/macros/chooser.js
type: application/javascript
module-type: macro

Zooming chooser macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "chooser",
	params: {
	}
};

exports.showChooser = function() {
	if(!this.chooserDisplayed) {
		this.chooserDisplayed = true;
		this.child.children[0].children = [];
		for(var t=0; t<this.content.length; t++) {
			var node = this.content[t].clone();
			node.execute(this.parents,this.tiddlerTitle);
			node.renderInDom(this.child.children[0].domNode);
			this.child.children[0].children.push(node);
		}
	}
};

/*
Set the position of the chooser panel within its wrapper given a touch/mouse position in screen coordinates
*/
exports.hoverChooser = function(x,y) {
	if(this.chooserDisplayed) {
		// Get the target element that the touch/mouse is over
		// this.select(y);
		// Things we need for sizing and positioning the chooser
		var domPanel = this.child.children[0].domNode,
			heightPanel = domPanel.offsetHeight,
			widthPanel = domPanel.offsetWidth;
		// Position the chooser div to account for scrolling
		domPanel.style.top = window.pageYOffset + "px";
		// Scale the panel to fit
		var scaleFactor = window.innerHeight/heightPanel;
		// Scale up as we move right
		var expandFactor = x > 50 ? ((x+150)/200) : 1;
		// Set up the transform
		var scale = scaleFactor * expandFactor,
			translateX = x > 16 ? 0 : -(((16-x)/16) * widthPanel) / scale,
			translateY = (y / scale) - ((y/window.innerHeight) * heightPanel);
		domPanel.style[$tw.browser.transformorigin] = "0 0";
		domPanel.style[$tw.browser.transform] = "scale(" + scale + ") translateX(" + translateX + "px) translateY(" + translateY + "px)";
	}
};

exports.hideChooser = function() {
	if(this.chooserDisplayed) {
		// this.deselect();
		this.chooserDisplayed = false;
		while(this.child.children[0].domNode.hasChildNodes()) {
			this.child.children[0].domNode.removeChild(this.child.children[0].domNode.firstChild);
		}
		this.child.children[0].children = [];
	}
};

exports.handleEvent = function(event) {
	switch(event.type) {
		case "touchstart":
			this.showChooser();
			this.hoverChooser(event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			return false;
		case "touchmove":
			this.hoverChooser(event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			return false;
		case "touchend":
			// this.action();
			this.hideChooser();
			event.preventDefault();
			return false;
		case "mouseover":
			if(event.target === this.child.domNode) {
				this.showChooser();
				this.hoverChooser(event.clientX,event.clientY);
				event.preventDefault();
				return false;
			}
			break;
		case "mousemove":
			this.hoverChooser(event.clientX,event.clientY);
			event.preventDefault();
			return false;
		case "mouseup":
			// this.action();
			this.hideChooser();
			event.preventDefault();
			return false;
		case "mouseout":
			if(!$tw.utils.domContains(this.child.domNode,event.relatedTarget)) {
				this.hideChooser();
				event.preventDefault();
				return false;
			}
			break;
	}
	return true;
};

exports.executeMacro = function() {
	this.chooserDisplayed = false;
	var wrapperAttributes = {
			style: {
				"position": "absolute",
				"left": "0",
				"top": "0",
				"min-width": "16px",
				"z-index": "2000",
				"height": "100%" // Makes the height the same as the body, since the body is position:relative
			}
		},
		innerAttributes = {
			style: {
				"margin": "0 0 0 0",
				"padding": "0px 4px 0px 4px",
				"top": "0",
				"min-width": "16px",
				"background": "#ddd",
				"z-index": "2000",
				"border-right": "1px solid #aaa"
			}
		};
	if(this.classes) {
		wrapperAttributes["class"] = this.classes.slice(0);
	}
	return $tw.Tree.Element("div",wrapperAttributes,[
			$tw.Tree.Element("div",innerAttributes,[])
		],{
			events: ["touchstart","touchmove","touchend","mouseover","mousemove","mouseup","mouseout"],
			eventHandler: this
		});
};

})();
