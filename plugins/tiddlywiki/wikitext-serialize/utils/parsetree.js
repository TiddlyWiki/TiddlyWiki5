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
			initSerializers(Parser);
			var serializeOneRule = Parser.prototype.serializers[tree.rule];
			if(serializeOneRule) {
				output.push(serializeOneRule(tree,serializeWikitextParseTree));
			} else if(tree.rule === "parseblock") {
				output.push(serializeWikitextParseTree(tree.children,options),"\n\n");
			} else {
				// when no rule is found, just serialize the children
				output.push(serializeWikitextParseTree(tree.children,options));
			}
		}
	}
	return output.join("");
};
