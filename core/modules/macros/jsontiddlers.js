/*\
title: $:/core/modules/macros/jsontiddlers.js
type: application/javascript
module-type: macro

Macro to output tiddlers matching a filter to JSON

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "jsontiddlers";

exports.params = [
	{name: "filter"}
];

/*
Run the macro
*/
exports.run = function(filter) {
	var tiddlers = this.wiki.filterTiddlers(filter),
		data = [];
	for(var t=0;t<tiddlers.length; t++) {
		var tiddler = this.wiki.getTiddler(tiddlers[t]);
		if(tiddler) {
			var fields = new Object();
			for(var field in tiddler.fields) {
				fields[field] = tiddler.getFieldString(field);
			}
			data.push(fields);
		}
	}
	return JSON.stringify(data,null,$tw.config.preferences.jsonSpaces);
};

})();
