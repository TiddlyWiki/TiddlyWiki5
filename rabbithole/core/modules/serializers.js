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

exports["application/x-tiddler-module"] = function(tiddler) {
	var result = [];
	result.push("<" + "script type=\"text/javascript\" data-tiddler-title=\"" + tiddler.fields.title + "\">\n");
	result.push("$tw.modules.define(\"" + tiddler.fields.title + "\",\"" + tiddler.fields["module-type"] + "\",function(module,exports,require) {");
	result.push(tiddler.fields.text);
	result.push("});\n");
	result.push("</" + "script>");
	return result.join("");
};

exports["application/x-tiddler-html-div"] = function(tiddler) {
	var result = [];
	result.push("<div");
	for(var f in tiddler.fields) {
		if(f !== "text") {
			result.push(" " + f + "=\"" + tiddler.getFieldString(f) + "\"");
		}
	}
	result.push(">\n<pre>");
	result.push($tw.utils.htmlEncode(tiddler.fields.text));
	result.push("</pre>\n</div>");
	return result.join("");
};

})();
