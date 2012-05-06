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

exports["application/x-tiddler-css"] = function(tiddler) {
	var attributes = {type: "text/css"}; // The script type is set to text/javascript for compatibility with old browsers
	for(var f in tiddler.fields) {
		if(f !== "text") {
			attributes["data-tiddler-" + f] = tiddler.getFieldString(f);
		}
	}
	return $tw.Tree.Element(
			"style",
			attributes,
			[$tw.Tree.Raw(tiddler.fields.text)]
		).render("text/html");
};

exports["application/javascript"] = function(tiddler) {
	var attributes = {type: "text/javascript"}; // The script type is set to text/javascript for compatibility with old browsers
	for(var f in tiddler.fields) {
		if(f !== "text") {
			attributes["data-tiddler-" + f] = tiddler.getFieldString(f);
		}
	}
	return $tw.Tree.Element(
			"script",
			attributes,
			[$tw.Tree.Raw(tiddler.fields.text)]
		).render("text/html");
};

exports["application/x-tiddler-module"] = function(tiddler) {
	var attributes = {
			type: "text/javascript",
			"data-module": "yes"
		}, // The script type is set to text/javascript for compatibility with old browsers
		text = tiddler.fields.text;
	text = "$tw.modules.define(\"" + tiddler.fields.title + "\",\"" + tiddler.fields["module-type"] + "\",function(module,exports,require) {" + text + "});\n";
	for(var f in tiddler.fields) {
		if(f !== "text") {
			attributes["data-tiddler-" + f] = tiddler.getFieldString(f);
		}
	}
	return $tw.Tree.Element(
			"script",
			attributes,
			[$tw.Tree.Raw(text)]
		).render("text/html");
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
