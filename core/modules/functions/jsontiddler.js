/*\
title: $:/core/modules/macros/jsontiddler.js
type: application/javascript
module-type: macro

Macro to output a single tiddler to JSON

\*/

"use strict";

/*
Information about this macro
*/

exports.name = "jsontiddler";

exports.params = [
	{name: "title"}
];

/*
Run the macro
*/
exports.run = function(title) {
	title = title || this.getVariable("currentTiddler");
	var tiddler = !!title && this.wiki.getTiddler(title),
		fields = new Object();
	if(tiddler) {
		for(var field in tiddler.fields) {
			fields[field] = tiddler.getFieldString(field);
		}
	}
	return JSON.stringify(fields,null,$tw.config.preferences.jsonSpaces);
};

