(function(){

/*jslint node: true */
"use strict";

var TiddlerConverters = function() {
	this.serializers = {};
	this.deserializers = {};
};

TiddlerConverters.prototype.registerSerializer = function(extension,mimeType,serializer) {
	this.serializers[extension] = serializer;
	this.serializers[mimeType] = serializer;
};

TiddlerConverters.prototype.registerDeserializer = function(extension,mimeType,deserializer) {
	this.deserializers[extension] = deserializer;
	this.deserializers[mimeType] = deserializer;
};

TiddlerConverters.prototype.serialize = function(type,tiddler) {
	var serializer = this.serializers[type];
	if(serializer) {
		return serializer(tiddler);
	} else {
		return null;
	}
};

TiddlerConverters.prototype.deserialize = function(type,text,srcFields) {
	var fields = {},
		deserializer = this.deserializers[type],
		t;
	if(srcFields) {
		for(t in srcFields) {
			fields[t] = srcFields[t];		
		}
	}
	if(deserializer) {
		return deserializer(text,fields);
	} else {
		// Return a raw tiddler for unknown types
		fields.text = text;
		return [fields];
	}
};

exports.TiddlerConverters = TiddlerConverters;

})();
