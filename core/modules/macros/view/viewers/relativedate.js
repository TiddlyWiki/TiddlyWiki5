/*\
title: $:/core/modules/macros/view/viewers/relativedate.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a relative date

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var RelativeDateViewer = function(viewMacro,tiddler,field,value) {
	this.viewMacro = viewMacro;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

RelativeDateViewer.prototype.render = function() {
	if(!this.tiddler ||this.value === undefined) {
		return $tw.Tree.Text("");
	} else {
		this.relativeDate = $tw.utils.getRelativeDate((new Date()) - this.value);
		return $tw.Tree.Element(this.viewMacro.isBlock ? "div" : "span",{},[
			$tw.Tree.Text(
				this.relativeDate.description
			)
		]);
	}
};

/*
Trigger the timer when the relative date is put into the DOM
*/
RelativeDateViewer.prototype.postRenderInDom = function() {
	if(this.relativeDate) {
		this.update();
	}
};

/*
Trigger the timer for the next update of the relative date
*/
RelativeDateViewer.prototype.setTimer = function() {
	var self = this;
	if(this.relativeDate.updatePeriod < 24 * 60 * 60 * 1000) {
		window.setTimeout(function() {
			// Only call the update function if the dom node is still in the document
			if($tw.utils.domContains(document,self.viewMacro.child.domNode)) {
				self.update.call(self);
			}
		},this.relativeDate.updatePeriod);
	}
};

/*
Update the relative date display, and trigger the timer for the next update
*/
RelativeDateViewer.prototype.update = function() {
	this.relativeDate = $tw.utils.getRelativeDate((new Date()) - this.value);
	if(this.relativeDate.delta > 0) {
		while(this.viewMacro.child.domNode.hasChildNodes()) {
			this.viewMacro.child.domNode.removeChild(this.viewMacro.child.domNode.firstChild);
		}
		this.viewMacro.child.domNode.appendChild(document.createTextNode(this.relativeDate.description));
		this.setTimer();
	}
};

exports.relativedate = RelativeDateViewer;

})();
