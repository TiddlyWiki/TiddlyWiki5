/*\
title: $:/core/modules/serializers.js
type: application/javascript
module-type: tiddlerserializer

Plugins to serialise tiddlers to a block of text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["text/plain"] = function(tiddler) {
	return tiddler ? tiddler.fields.text : "";
};

exports["text/html"] = function(tiddler) {
	var text = this.renderTiddler("text/html",tiddler.fields.title);
	return text ? text : "";
};

})();
