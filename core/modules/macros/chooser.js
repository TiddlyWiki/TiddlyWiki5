/*\
title: $:/core/modules/macros/chooser.js
type: application/javascript
module-type: macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "chooser",
	wrapperTag: "div",
	params: {
	},
	events: ["touchstart","touchmove","touchend","mouseover","mousemove","mouseup","mouseout"]
};

exports.showChooser = function() {
	if(!this.chooserDisplayed) {
		this.chooserDisplayed = true;
		var nodes = [];
		this.wiki.forEachTiddler("title",function(title,tiddler) {
			nodes.push($tw.Tree.Element("li",{
					"data-link": title
				},[
					$tw.Tree.Text(title)
				]));
		});
		var wrapper = $tw.Tree.Element("ul",{},nodes);
		wrapper.execute(this.parents,this.tiddlerTitle);
		this.children = [wrapper];
		this.children[0].renderInDom(this.domNode);
	}
};

/*
Select the appropriate chooser item given a touch/mouse position in screen coordinates
*/
exports.select = function(y) {
	if(this.children.length > 0) {
		var targetIndex = Math.floor(this.children[0].domNode.childNodes.length * (y/window.innerHeight)),
			target = this.children[0].domNode.childNodes[targetIndex];
		if(target) {
			this.deselect();
			this.selectedNode = target;
			$tw.utils.addClass(target,"selected");
		}
	}
};

exports.deselect = function() {
	if(this.selectedNode) {
		$tw.utils.removeClass(this.selectedNode,"selected");
		this.selectedNode = null;
	}
};

exports.action = function() {
	if(this.selectedNode) {
		var navEvent = document.createEvent("Event");
		navEvent.initEvent("tw-navigate",true,true);
		navEvent.navigateTo = this.selectedNode.getAttribute("data-link");
		this.domNode.dispatchEvent(navEvent); 
	}
};

/*
Set the position of the chooser panel within its wrapper given a touch/mouse position in screen coordinates
*/
exports.hoverChooser = function(x,y) {
	if(this.chooserDisplayed) {
		// Get the target element that the touch/mouse is over
		this.select(y);
		// Things we need for sizing and positioning the chooser
		var domPanel = this.children[0].domNode,
			heightPanel = domPanel.offsetHeight,
			widthPanel = domPanel.offsetWidth;
		// Position the chooser div to account for scrolling
		this.children[0].domNode.style.top = window.pageYOffset + "px";
		// Scale the panel to fit
		var scaleFactor = window.innerHeight/heightPanel;
		// Scale up as we move right
		var expandFactor = x > 50 ? ((x+150)/200) : 1;
		// Set up the transform
		var scale = scaleFactor * expandFactor,
			translateX = x > 16 ? 0 : -(((16-x)/16) * widthPanel) / scale,
			translateY = (y / scale) - ((y/window.innerHeight) * heightPanel);
		domPanel.style.webkitTransformOrigin = 
		domPanel.style.MozTransformOrigin = "0 0";
		domPanel.style.webkitTransform = 
		domPanel.style.MozTransform = "scale(" + scale + ") translateX(" + translateX + "px) translateY(" + translateY + "px)";
	}
};

exports.hideChooser = function() {
	if(this.chooserDisplayed) {
		this.deselect();
		this.chooserDisplayed = false;
		this.domNode.removeChild(this.children[0].domNode);
		this.children = [];
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
			this.action();
			this.hideChooser();
			event.preventDefault();
			return false;
		case "mouseover":
			if(event.target === this.domNode) {
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
			this.action();
			this.hideChooser();
			event.preventDefault();
			return false;
		case "mouseout":
			if(!$tw.utils.domContains(this.domNode,event.relatedTarget)) {
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
	return [];
};

})();
