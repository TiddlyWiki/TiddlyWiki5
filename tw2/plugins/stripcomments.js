/*\
title: $:/plugins/stripcomments.js
type: application/javascript
module-type: tiddlerserializer

Special serializer for cooking old versions of TiddlyWiki. It removes JavaScript comments formatted as `//#`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["text/plain-strip-comments"] = function(tiddler) {
	var lines =tiddler.fields.text.split("\n"),
		out = [];
	for(var line=0; line<lines.length; line++) {
		var text = lines[line];
		if(!/^\s*\/\/#/.test(text)) {
			out.push(text);
		}
	}
	return out.join("\n");
};

})();
