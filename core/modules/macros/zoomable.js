/*\
title: $:/core/modules/macros/zoomable.js
type: application/javascript
module-type: macro

Creates a zoomable frame around its content

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "zoomable",
	params: {
		width: {byName: true, type: "text"},
		height: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var innerClasses = ["tw-zoomable-inner"],
		innerAttributes = {
			"class": innerClasses,
			style: {
				overflow: "visible",
				position: "relative"
			}
		},
		outerClasses = ["tw-zoomable","tw-zoomable-outer"],
		outerAttributes = {
			"class": outerClasses,
			style: {
				overflow: "hidden",
				"white-space": "nowrap"
			}
		};
	if(this.hasParameter("class")) {
		outerClasses.push(this.params["class"]);
	}
	if(this.classes) {
		$tw.utils.pushTop(outerClasses,this.classes);
	}
	if(this.hasParameter("width")) {
		outerAttributes.style.width = this.params.width;
	}
	if(this.hasParameter("height")) {
		outerAttributes.style.height = this.params.height;
	}
	var self = this;
	this.innerFrame = $tw.Tree.Element("div",innerAttributes,this.content);
	this.outerFrame = $tw.Tree.Element("div",outerAttributes,[this.innerFrame],{
		events: ["tw-scroll","click"],
		eventHandler: this
	});
	this.outerFrame.execute(this.parents,this.tiddlerTitle);
	this.translateX = 0;
	this.translateY = 0;
	this.scale = 1;
	return this.outerFrame;
};

exports.postRenderInDom = function() {
	this.zoomAll();
};

/*
Bring a dom node into view by setting the viewport (translation and scale factors) appropriately.

The calculations are a little hairy. The problem is that we want to deal with coordinates that take into account CSS transformations applied to elements. The most reliable way to do that is to use getBoundingClientRect, which returns the bounding rectangle in screen coordinates of an element, taking into account any transformations.

So, we measure the position of the target element and then adjust it to compensate for the current viewport settings.
*/
exports.setViewPort = function(domNode) {
	var zoomPosString = domNode.getAttribute("data-tw-zoom");
	if(zoomPosString) {
		var zoomPos = JSON.parse(zoomPosString);
		if(zoomPos) {
			// Compute the transform for the inner frame
			this.translateX = -zoomPos.x;
			this.translateY = -zoomPos.y;
			this.scale = this.outerFrame.domNode.offsetWidth / zoomPos.w;
			$tw.utils.setStyle(this.innerFrame.domNode,[
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
				{transformOrigin: "0% 0%"},
				{transform: "translate(" + this.translateX * this.scale + "px," + this.translateY * this.scale + "px) scale(" + this.scale + ")"}
			]);
		}
	}
};

exports.zoomAll = function() {
	var bounds = {left: 0, top: 0, right: 0, bottom: 0},
		scanChildren = function(nodes) {
			for(var c=0; c<nodes.length; c++) {
				var node = nodes[c];
				if(node.getAttribute && node.getAttribute("data-tw-zoom")) {
					var zoom = JSON.parse(node.getAttribute("data-tw-zoom"));
					if(zoom === true) {
						zoom = {
							x: node.offsetLeft,
							y: node.offsetTop,
							w: node.scrollWidth,
							h: node.scrollHeight
						};
					}
					if(zoom.x < bounds.left) {
						bounds.left = zoom.x;
					}
					if(zoom.y < bounds.top) {
						bounds.top = zoom.y;
					}
					if((zoom.x + zoom.w) > bounds.right) {
						bounds.right = zoom.x + zoom.w;
					}
					if((zoom.y + zoom.h) > bounds.bottom) {
						bounds.bottom = zoom.y + zoom.h;
					}
				}
				if(node.hasChildNodes()) {
					scanChildren(node.childNodes);
				}
			}
		};
	scanChildren(this.innerFrame.domNode.childNodes);
	this.translateX = bounds.left;
	this.translateY = bounds.top;
	this.scale = this.outerFrame.domNode.offsetWidth / (bounds.right - bounds.left);
	$tw.utils.setStyle(this.innerFrame.domNode,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transformOrigin: "0% 0%"},
		{transform: "translate(" + this.translateX * this.scale + "px," + this.translateY * this.scale + "px) scale(" + this.scale + ")"}
	]);
};

exports.handleEvent = function(event) {
	if(event.type === "tw-scroll") {
		return this.handleScrollEvent(event);
	}
	if(event.type === "click") {
		this.zoomAll();
		return false;
	}
	return true;
}

exports.handleScrollEvent = function(event) {
	this.setViewPort(event.target);
	event.stopPropagation();
	return false;
};

})();
