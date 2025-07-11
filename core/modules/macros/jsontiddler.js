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
	const tiddler = !!title && this.wiki.getTiddler(title);
	const fields = new Object();
	if(tiddler) {
		for(const field in tiddler.fields) {
			fields[field] = tiddler.getFieldString(field);
		}
	}
	return JSON.stringify(fields,null,$tw.config.preferences.jsonSpaces);
};

