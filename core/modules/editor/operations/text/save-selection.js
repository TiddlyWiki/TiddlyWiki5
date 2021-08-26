/*\
title: $:/core/modules/editor/operations/text/save-selection.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to save the current selection in a specified tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["save-selection"] = function(event,operation) {
	var tiddler = event.paramObject.tiddler,
		field = event.paramObject.field || "text";
	if(tiddler && field) {
		this.wiki.setText(tiddler,field,null,operation.text.substring(operation.selStart,operation.selEnd));
	}
};

})();
