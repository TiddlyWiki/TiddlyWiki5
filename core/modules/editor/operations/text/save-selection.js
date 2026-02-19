/*\
title: $:/core/modules/editor/operations/text/save-selection.js
type: application/javascript
module-type: texteditoroperation
\*/

"use strict";

exports["save-selection"] = function(event,operation) {
	var tiddler = event.paramObject.tiddler,
		field = event.paramObject.field || "text";
	if(tiddler && field) {
		this.wiki.setText(tiddler,field,null,operation.text.substring(operation.selStart,operation.selEnd));
	}
};
