/*\
title: $:/core/modules/widgets/view/viewers/relativedate.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a relative date

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var RelativeDateViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

RelativeDateViewer.prototype.render = function() {
	var template = this.viewWidget.renderer.getAttribute("template","DD MMM YYYY"),
		value = "";
	if(this.value !== undefined) {
		value = $tw.utils.formatDateString(this.value,template);
	}
	// Set the element details
	this.viewWidget.tag = "span";
	this.viewWidget.attributes = {
		"class": "tw-view-date"
	};
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer,[{
		type: "text",
		text: value
	}]);
};

/*
Trigger the timer when the relative date is put into the DOM
*/
RelativeDateViewer.prototype.postRenderInDom = function() {
	this.update();
};

/*
Trigger the timer for the next update of the relative date
*/
RelativeDateViewer.prototype.setTimer = function() {
	var self = this;
	if(this.relativeDate.updatePeriod < 24 * 60 * 60 * 1000) {
		window.setTimeout(function() {
			// Only call the update function if the dom node is still in the document
			if($tw.utils.domContains(self.viewWidget.renderer.renderTree.document,self.viewWidget.renderer.domNode)) {
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
		while(this.viewWidget.renderer.domNode.hasChildNodes()) {
			this.viewWidget.renderer.domNode.removeChild(this.viewWidget.renderer.domNode.firstChild);
		}
		this.viewWidget.renderer.domNode.appendChild(this.viewWidget.renderer.renderTree.document.createTextNode(this.relativeDate.description));
		this.setTimer();
	}
};

exports.relativedate = RelativeDateViewer;

})();
