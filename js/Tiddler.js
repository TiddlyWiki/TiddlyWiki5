/*

Tiddlers are an immutable dictionary of name:value pairs called fields. Values can be a string, an array
of strings, or a date.

Hardcoded in the system is the knowledge that the 'tags' field is a string array, and that the 'modified'
and 'created' fields are dates. All other fields are strings.

The Tiddler object exposes the following API

new Tiddler(src) - create a Tiddler given a hashmap of field values or a tiddler to clone
new Tiddler(src1,src2) - create a Tiddler with the union of the fields from the
						sources, with the rightmost taking priority
Tiddler.fields - hashmap of tiddler fields

The hashmap(s) can specify the  "modified" and "created" fields as strings in YYYYMMDDHHMMSSMMM
format or as JavaScript date objects. The "tags" field can be given as a JavaScript array of strings or
as a TiddlyWiki quoted string (eg, "one [[two three]]").

*/

"use strict";

var Tiddler = function(/* tiddler,fields */) {
	this.fields = {};
	for(var c=0; c<arguments.length; c++) {
		var arg = arguments[c],
			src = null;
		if(arg instanceof Tiddler) {
			src = arg.fields;
		} else {
			src = arg;
		}
		for(var t in src) {
			var f = this.parseField(t,src[t]);
			if(f !== null) {
				this.fields[t] = f;
			}
		}
	}
};

Tiddler.prototype.parseField = function(name,value) {
	var type = Tiddler.specialFields[name];
	if(type) {
		return Tiddler.specialParsers[type](value);
	} else if (typeof value === "string") {
		return value;
	} else {
		return null;
	}
};

// These are the non-string fields
Tiddler.specialFields = {
	"created": "date",
	"modified": "date",
	"tags": "array"
};

Tiddler.specialParsers = {
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
			var parser = new ArgParser(value,{noNames: true});
			return parser.getValuesByName("","");
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
