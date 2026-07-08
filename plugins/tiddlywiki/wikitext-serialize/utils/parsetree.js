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
Serialize a parse tree node or array of nodes back to wikitext, dispatching on
the `node.rule` metadata added in `wikiparser.js`.
options.source: the wikitext the tree was parsed from; when present, node
positions are used to reproduce the original formatting, e.g. quoting styles.
*/
exports.serializeWikitextParseTree = function(tree,options) {
	options = options || {};
	var Parser = $tw.utils.getParser("text/vnd.tiddlywiki");
	initSerializers(Parser);
	var serializers = Parser.prototype.serializers;
	// A single closure keeps options bound across rules that only know the (tree,serialize) signature
	function serialize(tree) {
		var output = [];
		if($tw.utils.isArray(tree)) {
			$tw.utils.each(tree,function(node) {
				output.push(serialize(node));
			});
		} else if(tree) {
			if(tree.type === "text" && !tree.rule) {
				output.push(tree.text);
			} else {
				var serializeOneRule = serializers[tree.rule];
				if(serializeOneRule) {
					output.push(serializeOneRule(tree,serialize,options));
				} else if(tree.rule === "parseblock") {
					output.push(serialize(tree.children),"\n\n");
				} else {
					// when no rule is found, just serialize the children, for example the void nodes
					output.push(serialize(tree.children));
				}
			}
		}
		return output.join("");
	}
	return serialize(tree);
};

/*
Detect the quoting style of an attribute value by inspecting the original
source text via the node's start and end positions. Positions are reliable:
source.slice(start,end) equals the node text (see #9882).
Returns "bare", "unquoted", "single", "double", "triple", "bracket",
"backtick", "tripleBacktick" or null when no source information is available.
*/
function detectQuoteStyle(node,source) {
	if(!source || typeof node.start !== "number" || typeof node.end !== "number" || node.end <= node.start) {
		return null;
	}
	var pos = $tw.utils.skipWhiteSpace(source,node.start);
	if(!node.isPositional) {
		if(source.substr(pos,node.name.length) !== node.name) {
			return null;
		}
		pos = $tw.utils.skipWhiteSpace(source,pos + node.name.length);
		if(pos >= node.end) {
			// No assignment operator in the source: a valueless attribute
			return "bare";
		}
		var op = source.charAt(pos);
		if(op !== "=" && op !== ":") {
			return "bare";
		}
		pos = $tw.utils.skipWhiteSpace(source,pos + 1);
	}
	if(pos >= node.end) {
		return "bare";
	}
	var ch = source.charAt(pos);
	if(ch === '"') {
		return source.substr(pos,3) === '"""' ? "triple" : "double";
	} else if(ch === "'") {
		return "single";
	} else if(ch === "[" && source.charAt(pos + 1) === "[") {
		return "bracket";
	} else if(ch === "`") {
		return source.substr(pos,3) === "```" ? "tripleBacktick" : "backtick";
	}
	return "unquoted";
}

/*
Check whether a quoting style can hold the given value without breaking the parse
*/
function styleAllows(style,value,isMacroParameter) {
	switch(style) {
		case "bare":
			return value === "true";
		case "unquoted":
			if(value === "" || /[\s"']/.test(value)) {
				return false;
			}
			if(isMacroParameter) {
				return value.indexOf(">>") === -1 && value.substring(0,2) !== "<<";
			}
			return !/[\/<>=`]/.test(value);
		case "single":
			return value.indexOf("'") === -1;
		case "double":
			return value.indexOf('"') === -1;
		case "triple":
			return value.indexOf('"""') === -1 && value.charAt(value.length - 1) !== '"';
		case "bracket":
			return value.indexOf("]]") === -1 && value.charAt(value.length - 1) !== "]";
	}
	return false;
}

/*
Wrap a value in the given quoting style
*/
function quoteValue(style,value) {
	switch(style) {
		case "unquoted": return value;
		case "single": return "'" + value + "'";
		case "triple": return '"""' + value + '"""';
		case "bracket": return "[[" + value + "]]";
		default: return '"' + value + '"';
	}
}

/*
Return the exact source text of a node, or null for synthesized or mutated
nodes.
options.source: the wikitext the tree was parsed from.
options.fragments: strings that must all appear in the slice, so a tree
transform that edited the node (e.g. renamed a macro) falls back to canonical
serialization instead of replaying stale source text.
*/
exports.serializeFromSource = function(node,options) {
	options = options || {};
	var source = options.source;
	if(!source || typeof node.start !== "number" || typeof node.end !== "number" || node.end <= node.start) {
		return null;
	}
	var slice = source.substring(node.start,node.end),
		trusted = true;
	$tw.utils.each(options.fragments || [],function(fragment) {
		if(slice.indexOf(fragment) === -1) {
			trusted = false;
			return false;
		}
	});
	return trusted ? slice : null;
};

/*
Serialize a parsed attribute node.
options.source: original wikitext used to preserve the original quoting style.
*/
exports.serializeAttribute = function(node,options) {
	options = options || {};
	if(!node || typeof node !== "object" || !node.name || !node.type) {
		return null;
	}
	// A numeric name marks a positional parameter; the name is not written out
	var positional = parseInt(node.name) >= 0,
		assign = positional ? "" : (node.assignmentOperator || "="),
		attributeString = positional ? "" : node.name;
	if(node.type === "string") {
		var isMacroParameter = node.isPositional || node.assignmentOperator !== undefined,
			style = detectQuoteStyle(node,options.source);
		// A mutated value may no longer fit the original quotes, e.g. a '"' added inside "..."
		if(style && !styleAllows(style,node.value,isMacroParameter)) {
			style = null;
		}
		if(!style) {
			// Canonical fallback: the plainest style that can hold the value
			if(!isMacroParameter && node.value === "true") {
				style = "bare";
			} else if(isMacroParameter && !node.quoted && styleAllows("unquoted",node.value,true)) {
				style = "unquoted";
			} else if(styleAllows("double",node.value)) {
				style = "double";
			} else if(styleAllows("single",node.value)) {
				style = "single";
			} else if(styleAllows("triple",node.value)) {
				style = "triple";
			} else if(styleAllows("bracket",node.value)) {
				style = "bracket";
			} else {
				style = "double";
			}
		}
		if(style === "bare") {
			return attributeString;
		}
		attributeString += assign + quoteValue(style,node.value);
	} else if(node.type === "filtered") {
		attributeString += assign + "{{{" + node.filter + "}}}";
	} else if(node.type === "indirect") {
		attributeString += assign + "{{" + node.textReference + "}}";
	} else if(node.type === "substituted") {
		var subStyle = detectQuoteStyle(node,options.source);
		if(subStyle !== "backtick" && subStyle !== "tripleBacktick") {
			subStyle = null;
		}
		if(subStyle === "backtick" && node.rawValue.indexOf("`") !== -1) {
			subStyle = "tripleBacktick";
		}
		if(!subStyle) {
			subStyle = node.rawValue.indexOf("`") === -1 ? "backtick" : "tripleBacktick";
		}
		if(subStyle === "tripleBacktick") {
			attributeString += assign + "```" + node.rawValue + "```";
		} else {
			attributeString += assign + "`" + node.rawValue + "`";
		}
	} else if(node.type === "macro") {
		if(node.isMVV && node.value && node.value.attributes && node.value.attributes["$variable"]) {
			// Multi-valued variable reference: ((varname))
			attributeString += assign + "((" + node.value.attributes["$variable"].value + "))";
		} else if(node.value && typeof node.value === "object") {
			if(node.value.type === "transclude") {
				var macroName = node.value.attributes && node.value.attributes["$variable"] ? 
					node.value.attributes["$variable"].value : "";
				if(!macroName) {
					return null;
				}
				var params = [];
				if(node.value.orderedAttributes) {
					node.value.orderedAttributes.forEach(function(attr) {
						if(attr.name !== "$variable") {
							var paramStr = exports.serializeAttribute(attr,options);
							if(paramStr) {
								params.push(paramStr);
							}
						}
					});
				}
				attributeString += assign + "<<" + macroName + (params.length > 0 ? " " + params.join(" ") : "") + ">>";
			} else if(node.value.type === "macrocall") {
				// Classical macrocall nodes kept for backwards compatibility
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
