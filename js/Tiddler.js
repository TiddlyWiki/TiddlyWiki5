/*

Tiddlers are an immutable dictionary of name:value pairs called fields. Values can be a string, an array
of strings, or a date.

Hardcoded in the system is the knowledge that the 'tags' field is a string array, and that the 'modified'
and 'created' fields are dates. All other fields are strings.

The Tiddler object exposes the following API

new Tiddler(fields) - create a Tiddler given a hashmap of field values
new Tiddler(tiddler,fields) - create a Tiddler from an existing tiddler with a hashmap of modified field values
Tiddler.fields - hashmap of tiddler fields

*/

"use strict";

var Tiddler = function(/* tiddler,fields */) {
	var tiddler, fields, c = 0, t;
	if(arguments[c] instanceof Tiddler) {
		tiddler = arguments[c++];
	}
	fields = arguments[c++];
	this.fields = {};
	if(tiddler instanceof Tiddler) {
		for(t in tiddler.fields) {
			this.fields[t] = tiddler.fields[t]; // Should copy arrays by value
		}
	}
	for(t in fields) {
		this.fields[t] = fields[t]; // Should copy arrays by value
	}
}

exports.Tiddler = Tiddler;
