/*\
title: js/macros/chooser.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
    Dependencies = require("../Dependencies.js").Dependencies,
	Tiddler = require("../Tiddler.js").Tiddler,
	utils = require("../Utils.js");

function positionChooserPanel(macroNode,x,y) {
	var domWrapper = macroNode.domNode,
		heightWrapper = domWrapper.offsetHeight,
		rectWrapper = domWrapper.getBoundingClientRect(),
		domPanel = macroNode.content[0].domNode,
		heightPanel = domPanel.offsetHeight,
		rectPanel = domPanel.getBoundingClientRect();
	// Make the coordinates relative to the wrapper
	x = x - rectWrapper.left;
	y = y - rectWrapper.top;
	// Scale the panel to fit
	var scaleFactor = heightWrapper/heightPanel;
	// Scale up as we move right
	var expandFactor = ((100+x)/100);
	// Set up the transform
	var scale = scaleFactor * expandFactor,
		translate = (y / scale) - ((y/heightWrapper) * heightPanel);
	domPanel.style.webkitTransformOrigin = "0 0";
	domPanel.style.webkitTransform = "scale(" + scale + ") translateY(" + translate + "px)";
}

function loadContent(macroNode) {
	var nodes = [];
	macroNode.store.forEachTiddler("title",function(title,tiddler) {
		nodes.push(Renderer.ElementNode("li",{},[
				Renderer.TextNode(title)
			]));
	});
	var wrapper = Renderer.ElementNode("ul",{},nodes);
	wrapper.execute(macroNode.parents,macroNode.store.getTiddler(macroNode.tiddlerTitle));
	macroNode.content = [wrapper];
	macroNode.content[0].renderInDom(macroNode.domNode);
}

function removeContent(macroNode) {
	macroNode.domNode.removeChild(macroNode.content[0].domNode);
	macroNode.content = [];
}

exports.macro = {
	name: "chooser",
	wrapperTag: "div",
	params: {
	},
	events: {
		touchstart: function(event) {
			this.domNode.style.backgroundColor = "red";
			loadContent(this);
			positionChooserPanel(this,event.touches[0].pageX,event.touches[0].pageY);
			event.preventDefault();
			return false;
		},
		touchmove: function(event) {
			positionChooserPanel(this,event.touches[0].pageX,event.touches[0].pageY);
			event.preventDefault();
			return false;
		},
		touchend: function(event) {
			this.domNode.style.backgroundColor = "blue";
			removeContent(this);
			event.preventDefault();
			return false;
		},
		mouseover: function(event) {
			if(event.target === this.domNode) {
				loadContent(this);
				positionChooserPanel(this,event.clientX,event.clientY);
				event.preventDefault();
				return false;
			}
		},
		mousemove: function(event) {
			positionChooserPanel(this,event.clientX,event.clientY);
			event.preventDefault();
			return false;
		},
		mouseout: function(event) {
			if(!utils.domContains(this.domNode,event.relatedTarget)) {
				removeContent(this);
				event.preventDefault();
				return false;
			}
		}
	},
	execute: function() {
		return [];
	}
};

})();

