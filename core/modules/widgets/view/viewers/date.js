/*\
title: $:/core/modules/widgets/view/viewers/date.js
type: application/javascript
module-type: newfieldviewer

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
	return this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,[{
		type: "text",
		text: value
	}]);
};

exports.date = DateViewer;

})();
