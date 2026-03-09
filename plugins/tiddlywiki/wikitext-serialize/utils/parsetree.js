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
		// Use the original assignment operator if available, otherwise default to '='
		assign = positional ? "" : (node.assignmentOperator || "="),
		attributeString = positional ? "" : node.name;
	if(node.type === "string") {
		if(node.value === "true") {
			return attributeString;
		}
		// For macro parameters (using ':' separator), preserve unquoted values
		// For widget attributes (using '=' separator), always use quotes
		if(assign === ":" && !node.quoted) {
			attributeString += assign + node.value;
		} else if(assign === "") {
			// Positional parameter
			if(!node.quoted) {
				attributeString += node.value;
			} else {
				attributeString += '"' + node.value + '"';
			}
		} else {
			attributeString += assign + '"' + node.value + '"';
		}
	} else if(node.type === "filtered") {
		attributeString += assign + "{{{" + node.filter + "}}}";
	} else if(node.type === "indirect") {
		attributeString += assign + "{{" + node.textReference + "}}";
	} else if(node.type === "substituted") {
		attributeString += assign + "`" + node.rawValue + "`";
	} else if(node.type === "macro") {
		if(node.value && typeof node.value === "object") {
			if(node.value.type === "transclude") {
				// Handle the transclude-based macro call structure
				var macroName = node.value.attributes && node.value.attributes["$variable"] ? 
					node.value.attributes["$variable"].value : "";
				if(!macroName) {
					return null;
				}
				var params = [];
				if(node.value.orderedAttributes) {
					node.value.orderedAttributes.forEach(function(attr) {
						if(attr.name !== "$variable") {
							var paramStr = exports.serializeAttribute(attr);
							if(paramStr) {
								params.push(paramStr);
							}
						}
					});
				}
				attributeString += assign + "<<" + macroName + (params.length > 0 ? " " + params.join(" ") : "") + ">>";
			} else if(node.value.type === "macrocall") {
				// Handle the classical macrocall structure for backwards compatibility
				var params = node.value.params.map(function(param) {
					return param.value;
				}).join(" ");
				attributeString += assign + "<<" + node.value.name + " " + params + ">>";
			} else {
				// Unsupported macro structure
				return null;
			}
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
