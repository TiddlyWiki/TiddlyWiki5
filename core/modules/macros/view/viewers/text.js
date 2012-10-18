/*\
title: $:/core/modules/macros/view/viewers/text.js
type: application/javascript
module-type: viewer

A viewer for viewing tiddler fields as plain text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function renderValue(tiddler,field,value,viewMacro) {
	// Get the value as a string
	if(field !== "text" && tiddler) {
		value = tiddler.getFieldString(field);
	}
	// Return the text
	if(value === undefined || value === null) {
		return $tw.Tree.Text("");
	} else {
		return $tw.Tree.Text(value);
	}
}

exports["text"] = renderValue;

})();
