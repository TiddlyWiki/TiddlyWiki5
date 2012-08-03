/*\
title: $:/core/modules/serializers.js
type: application/javascript
module-type: tiddlerserializer

Functions to serialise tiddlers to a block of text

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

exports["application/x-tiddler-library"] = function(tiddler) {
	var attributes = {
			type: "text/javascript"
		}, // The script type is set to text/javascript for compatibility with old browsers
		text = tiddler.fields.text;
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
	var result = [],
		fields = [],
		pullField = function(name) {
			var fieldIndex = fields.indexOf(name);
			if(fieldIndex !== -1) {
				fields.splice(fieldIndex,1);
				fields.unshift(name);
			}
		};
	result.push("<div");
	// Collect the field names in the tiddler
	for(var f in tiddler.fields) {
		if(f !== "text") {
			fields.push(f);
		}
	}
	// Sort the fields
	fields.sort();
	// Pull the standard fields up to the top
	pullField("tags");
	pullField("modified");
	pullField("created");
	pullField("modifier");
	pullField("creator");
	pullField("title");
	// Output the fields
	for(f=0; f<fields.length; f++) {
		result.push(" " + fields[f] + "=\"" + $tw.utils.htmlEncode(tiddler.getFieldString(fields[f])) + "\"");
	}
	result.push(">\n<pre>");
	result.push($tw.utils.htmlEncode(tiddler.fields.text));
	result.push("</pre>\n</div>");
	return result.join("");
};

})();
