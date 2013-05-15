/*\
title: $:/core/modules/widgets/view/viewers/date.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a date

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DateViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

DateViewer.prototype.render = function() {
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

exports.date = DateViewer;

})();
