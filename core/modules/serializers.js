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

// Helper function
var mapEachTiddler = function(wiki,tiddlers,callback) {
	var result = [];
	for(var t=0; t<tiddlers.length; t++) {
		var tiddler = tiddlers[t];
		if(tiddler) {
			result.push(callback.call(wiki,tiddler));
		}
	}
	return result.join("");
};

exports["text/plain"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
		return tiddler.fields.text;
	});
};

exports["text/html"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
		return this.renderTiddler("text/html",tiddler.fields.title);
	});
};

exports["application/x-tiddler-css"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
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
	});
};

exports["application/javascript"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
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
	});
};

exports["application/x-tiddler-module"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
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
	});
};

exports["application/x-tiddler-module-plain"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
		return "$tw.modules.define(\"" + tiddler.fields.title + "\",\"" + tiddler.fields["module-type"] + "\",function(module,exports,require) {" + tiddler.fields.text + "});\n";
	});
};

exports["application/x-tiddler-library"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
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
	});
};

exports["application/x-tiddler-html-div"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
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
	});
};

exports["application/x-tiddler-encrypted-div"] = function(tiddlers) {
	// Build up the JSON object representing the tiddlers
	var jsonTiddlers = {},
		t, f;
	for(t=0; t<tiddlers.length; t++) {
		var tiddler = tiddlers[t],
			jsonTiddler = jsonTiddlers[tiddler.fields.title] = {};
		for(f in tiddler.fields) {
			jsonTiddler[f] = tiddler.getFieldString(f);
		}
	}
	// Encrypt the JSON of the tiddlers
	return "<div data-tw-encrypted-tiddlers='yes'><pre>" + $tw.utils.htmlEncode($tw.crypto.encrypt(JSON.stringify(jsonTiddlers))) + "</pre></div>";
};

exports["application/x-tiddler-javascript"] = function(tiddlers) {
	return mapEachTiddler(this,tiddlers,function(tiddler) {
		return "$tw.preloadTiddler(" + JSON.stringify(tiddler.fields) + ");\n";
	});
};

})();
