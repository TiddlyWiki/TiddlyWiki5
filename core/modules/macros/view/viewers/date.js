/*\
title: $:/core/modules/macros/view/viewers/date.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a date

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DateViewer = function(viewMacro,tiddler,field,value) {
	this.viewMacro = viewMacro;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

DateViewer.prototype.render = function() {
	var template = this.viewMacro.params.template || "DD MMM YYYY";
	if(this.value === undefined) {
		return $tw.Tree.Text("");
	} else {
		return $tw.Tree.Text($tw.utils.formatDateString(this.value,template));
	}
};

exports["date"] = DateViewer;

})();
