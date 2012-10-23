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

function renderValue(tiddler,field,value,viewMacro) {
	var template = viewMacro.params.template || "DD MMM YYYY";
	if(value === undefined) {
		return $tw.Tree.Text("");
	} else {
		return $tw.Tree.Text($tw.utils.formatDateString(value,template));
	}
}

exports["date"] = renderValue;

})();
