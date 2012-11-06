/*\
title: $:/core/modules/macros/scrollable.js
type: application/javascript
module-type: macro

Creates a scrollable frame around its content

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "scrollable",
	params: {
		width: {byName: true, type: "text"},
		height: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var innerClasses = ["tw-scrollable-inner"],
		innerAttributes = {
			"class": innerClasses,
			style: {
				overflow: "visible",
				position: "relative"
			}
		},
		outerClasses = ["tw-scrollable","tw-scrollable-outer"],
		outerAttributes = {
			"class": outerClasses,
			style: {
				overflow: "auto",
				"-webkit-overflow-scrolling": "touch",
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
	var innerFrame = $tw.Tree.Element("div",innerAttributes,this.content),
		outerFrame = $tw.Tree.Element("div",outerAttributes,[innerFrame]);
	outerFrame.execute(this.parents,this.tiddlerTitle);
	return outerFrame;
};

exports.postRenderInDom = function() {
	// Attach a scrollTo() method to the outer wrapper
	var self = this;
	this.child.children[0].domNode.scrollTo = function(bounds) {
		self.scrollTo.call(self,bounds);
	};
};

var slowInSlowOut = function(t) {
	return (1 - ((Math.cos(t * Math.PI) + 1) / 2));
};

exports.scrollTo = function(bounds) {
	this.cancelScroll();
	this.startTime = new Date();
	this.startX = this.child.domNode.scrollLeft;
	this.startY = this.child.domNode.scrollTop;
	this.endX = bounds.left;
	this.endY = bounds.top;
	if((this.endX < this.startX) || (this.endX > (this.startX + this.child.domNode.offsetWidth)) || (this.endY < this.startY) || (this.endY > (this.startY + this.child.domNode.offsetHeight))) {
		var self = this;
		this.scrollTimerId = window.setInterval(function() {
			var t = ((new Date()) - self.startTime) / $tw.config.preferences.animationDuration;
			if(t >= 1) {
				self.cancelScroll();
				t = 1;
			}
			t = slowInSlowOut(t);
			self.child.domNode.scrollLeft = self.startX + (self.endX - self.startX) * t;
			self.child.domNode.scrollTop = self.startY + (self.endY - self.startY) * t;
		}, 10);
	}
};

exports.cancelScroll = function() {
	if(this.scrollTimerId) {
		window.clearInterval(this.scrollTimerId);
		this.scrollTimerId = null;
	}
};

})();
