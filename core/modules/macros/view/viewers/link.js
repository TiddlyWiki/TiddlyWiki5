/*\
title: $:/core/modules/macros/view/viewers/link.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a link

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function renderValue(tiddler,field,value,viewMacro) {
	if(value === undefined) {
		return $tw.Tree.Text("");
	} else {
		var link = $tw.Tree.Macro("link",{
									srcParams: {to: value},
									content: [$tw.Tree.Text(value)],
									isBlock: viewMacro.isBlock,
									wiki: viewMacro.wiki
								});
		link.execute(viewMacro.parents,viewMacro.tiddlerTitle);
		return link;
	}
}

exports["link"] = renderValue;

})();
