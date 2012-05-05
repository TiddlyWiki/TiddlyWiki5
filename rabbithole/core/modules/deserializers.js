/*\
title: $:/core/modules/deserializers.js
type: application/javascript
module-type: tiddlerdeserializer

Plugins to deserialise tiddlers from a block of text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["text/plain"] = function(text,fields) {
	fields.text = text;
	fields.type = "text/plain";
	return [fields];
};

exports["text/html"] = function(text,fields) {
	fields.text = text;
	fields.type = "text/html";
	return [fields];
};

})();
