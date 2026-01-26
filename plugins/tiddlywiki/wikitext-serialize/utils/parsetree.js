/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/utils/parsetree.js
type: application/javascript
module-type: utils

Parse tree utility functions.

\*/

"use strict";

function initSerializers(Parser) {
	if(Parser && !Parser.prototype.serializers) {
		Parser.prototype.serializers = {};
		$tw.modules.forEachModuleOfType("wikiruleserializer",function(title,module) {
			var rule = module.name;
			var serialize = module.serialize;
			Parser.prototype.serializers[rule] = serialize;
		});
	}
};

/*
Utility to get the (similarly but not 1:1 equal) original wikitext of a parse tree node or array of nodes.
Based on `node.rule` metadata added in `wikiparser.js`.
*/
exports.serializeWikitextParseTree = function serializeWikitextParseTree(tree,options) {
	options = options || {};
	var output = [];
	if($tw.utils.isArray(tree)) {
		$tw.utils.each(tree,function(node) {
			output.push(serializeWikitextParseTree(node,options));
		});
	} else if(tree) {
		if(tree.type === "text" && !tree.rule) {
			output.push(tree.text);
		} else {
			var Parser = $tw.utils.getParser("text/vnd.tiddlywiki");
			// initialize the serializers only once on first use
			initSerializers(Parser);
			var serializeOneRule = Parser.prototype.serializers[tree.rule];
			if(serializeOneRule) {
				output.push(serializeOneRule(tree,serializeWikitextParseTree));
			} else if(tree.rule === "parseblock") {
				output.push(serializeWikitextParseTree(tree.children,options),"\n\n");
			} else {
				// when no rule is found, just serialize the children, for example the void nodes
				output.push(serializeWikitextParseTree(tree.children,options));
			}
		}
	}
	return output.join("");
};

/*
Serialize a parsed attribute node
*/
exports.serializeAttribute = function(node,options) {
	options = options || {};
	if(!node || typeof node !== "object" || !node.name || !node.type) {
		return null;
	}
	// If name is number, means it is a positional attribute and name is omitted
	var positional = parseInt(node.name) >= 0,
		// `=` in a widget and might be `:` in a macro
		assign = positional ? "" : (options.assignmentSymbol || "="),
		attributeString = positional ? "" : node.name;
	if(node.type === "string") {
		if(node.value === "true") {
			return attributeString;
		}
		attributeString += assign + '"' + node.value + '"';
	} else if(node.type === "filtered") {
		attributeString += assign + "{{{" + node.filter + "}}}";
	} else if(node.type === "indirect") {
		attributeString += assign + "{{" + node.textReference + "}}";
	} else if(node.type === "substituted") {
		attributeString += assign + "`" + node.rawValue + "`";
	} else if(node.type === "macro") {
		if(node.value && typeof node.value === "object" && node.value.type === "macrocall") {
			var params = node.value.params.map(function(param) {
				return param.value;
			}).join(" ");
			attributeString += assign + "<<" + node.value.name + " " + params + ">>";
		} else {
			// Unsupported macro structure
			return null;
		}
	} else {
		 // Unsupported type
		return null;
	}
	return attributeString;
};
