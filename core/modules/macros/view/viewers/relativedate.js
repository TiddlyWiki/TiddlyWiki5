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

function renderValue(tiddler,field,value,viewMacro) {
	if(value === undefined) {
		return $tw.Tree.Text("");
	} else {
		return $tw.Tree.Text(
			$tw.utils.getRelativeDate((new Date()) - value).description
		);
	}
}

exports["relativedate"] = renderValue;

})();
