/*\
title: js/Tiddler.js

Tiddlers are an immutable dictionary of name:value pairs called fields. Values can be a string,
an array of strings, or a JavaScript date object.

The only field that is required is the `title` field, but useful tiddlers also have a `text`
field, and some or all of the standard fields `modified`, `modifier`, `created`, `creator`,
`tags` and `type`.

Hardcoded in the system is the knowledge that the 'tags' field is a string array, and that
the 'modified' and 'created' fields are dates. All other fields are strings.

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js"),
	ArgParser = require("./ArgParser.js").ArgParser;

var Tiddler = function(/* tiddler,fields */) {
	var fields = {}, // Keep the fields private, later we'll expose getters for them
		tags, // Keep the tags separately because they're the only Array field
		f,t,c,arg,src;
	// Accumulate the supplied fields
	for(c=0; c<arguments.length; c++) {
		arg = arguments[c];
		src = null;
		if(arg instanceof Tiddler) {
			src = arg.fields;
		} else {
			src = arg;
		}
		for(t in src) {
			f = Tiddler.parseTiddlerField(t,src[t]);
			if(f !== null) {
				fields[t] = f;
			}
		}
	}
	// Pull out the tags
	if(fields.tags) {
		tags = fields.tags;
		delete fields.tags;
	}
	// Expose the fields as read only properties
	for(f in fields) {
		Object.defineProperty(this,f,{value: fields[f], writeable: false});
	}
	// Expose the tags as a getter
	Object.defineProperty(this,"tags",{get: function() {return tags ? tags.slice(0) : [];}});
	// Other methods that need access to the fields
	this.getFields = function() {
		var r = {};
		for(var f in fields) {
			var v = fields[f];
			if(v instanceof Array) {
				r[f] = v.slice(0);
			} else {
				r[f] = v;
			}
		}
		if(tags) {
			r.tags = tags;
		}
		return r;
	};
};

Tiddler.prototype.hasTag = function(tag) {
	return this.tags.indexOf(tag) !== -1;
};

Tiddler.standardFields = {
	title: {		type: "string"},
	modifier: {		type: "string"},
	modified: {		type: "date"},
	creator: {		type: "string"},
	created: {		type: "date"},
	tags: {			type: "tags"},
	type: {			type: "string"},
	text: {			type: "string"}
};

Tiddler.isStandardField = function(name) {
	return name in Tiddler.standardFields;
};

Tiddler.compareTiddlerFields = function(a,b,sortField) {
	var aa = a[sortField] || 0,
		bb = b[sortField] || 0;
	if(aa < bb) {
		return -1;
	} else {
		if(aa > bb) {
			return 1;
		} else {
			return 0;
		}
	}
};

Tiddler.parseTiddlerField = function(name,value) {
	var type = Tiddler.specialTiddlerFields[name];
	if(type) {
		return Tiddler.specialTiddlerFieldParsers[type](value);
	} else if (typeof value === "string") {
		return value;
	} else {
		return null;
	}
};

// These are the non-string fields
Tiddler.specialTiddlerFields = {
	"created": "date",
	"modified": "date",
	"tags": "array"
};

Tiddler.specialTiddlerFieldParsers = {
	date: function(value) {
		if(typeof value === "string") {
			return utils.convertFromYYYYMMDDHHMMSSMMM(value);
		} else if (value instanceof Date) {
			return value;
		} else {
			return null;
		}
	},
	array: function(value) {
		if(typeof value === "string") {
			var parser = new ArgParser(value,{noNames: true, allowEval: false});
			return parser.getStringValues();
		} else if (value instanceof Array) {
			var result = [];
			for(var t=0; t<value.length; t++) {
				if(typeof value[t] === "string") {
					result.push(value[t]);
				}
			}
			return result;
		} else {
			return null;
		}
	}
};

exports.Tiddler = Tiddler;

})();
