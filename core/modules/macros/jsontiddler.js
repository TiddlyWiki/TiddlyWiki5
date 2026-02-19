/*\
title: $:/core/modules/macros/jsontiddler.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "jsontiddler";

exports.params = [
	{name: "title"}
];

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
