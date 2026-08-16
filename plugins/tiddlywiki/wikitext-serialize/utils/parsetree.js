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
/*
A block node needs a separator towards a following sibling. Annotated trees
carry blockPosition; paragraphs signal it through their rule name; trees
from an unannotated parser fall back to isBlock plus the rule name suffix.
*/
function isBlockNode(node) {
	if(!node || typeof node !== "object") {
		return false;
	}
	if(node.blockPosition !== undefined) {
		return node.blockPosition;
	}
	if(node.rule === "parseblock") {
		return true;
	}
	return node.isBlock === true || (typeof node.rule === "string" && node.rule !== "commentblock" && node.rule.slice(-5) === "block");
}

exports.serializeWikitextParseTree = function(tree,options) {
	options = options || {};
	var Parser = $tw.utils.getParser("text/vnd.tiddlywiki");
	initSerializers(Parser);
	var serializers = Parser.prototype.serializers;
	// A single closure keeps options bound across rules that only know the (tree,serialize) signature
	function serialize(tree) {
		var output = [];
		if($tw.utils.isArray(tree)) {
			$tw.utils.each(tree,function(node,index) {
				output.push(serialize(node));
				// The walker owns the separator between block siblings; rule
				// serializers emit their own syntax only
				if(index < tree.length - 1 && isBlockNode(node)) {
					output.push("\n\n");
				}
			});
		} else if(tree) {
			if(tree.type === "text" && !tree.rule) {
				var text = tree.text;
				if(options.source && typeof tree.start === "number" && typeof tree.end === "number") {
					// \whitespace trim eats the edges of text runs but keeps
					// the original span; the slice restores the eaten bytes
					var slice = options.source.substring(tree.start,tree.end);
					if(slice !== text && slice.trim() === text) {
						text = slice;
					}
				}
				output.push(text);
			} else {
				var serializeOneRule = serializers[tree.rule];
				if(serializeOneRule) {
					output.push(serializeOneRule(tree,serialize,options));
				} else if(tree.rule === "parseblock") {
					// Stitch restores gaps that only exist in the source,
					// e.g. the line breaks eaten by \whitespace trim
					var stitched = options.source ? exports.serializeStitched(tree,serialize,{source: options.source}) : null;
					output.push(stitched !== null ? stitched : serialize(tree.children));
				} else {
					// when no rule is found, just serialize the children, for example the void nodes
					output.push(serialize(tree.children));
				}
			}
		}
		return output.join("");
	}
	var result = null;
	if(options.source && $tw.utils.isArray(tree)) {
		// Stitch the root blocks with the true separators from the source,
		// including indentation before the first block and the exact tail
		result = exports.serializeStitched({start: 0, end: options.source.length, children: tree},serialize,{source: options.source});
	}
	if(result === null) {
		result = serialize(tree);
		// A trailing block macro call or block widget needs its line end to
		// stay a block on reparse
		var last = $tw.utils.isArray(tree) ? tree[tree.length - 1] : tree;
		if(last && (last.rule === "macrocallblock" || (last.rule === "html" && isBlockNode(last)))) {
			result += "\n";
		}
	}
	return result;
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
transform that edited the node (e.g. renamed a macro) falls back to
serializing from the tree instead of replaying stale source text.
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
Stitch serialized nodes (options.children, default tree.children) with the
source gaps between them, which hold syntax the tree does not record, e.g.
<<< fences. Null when a gap fails options.isBoundary (default whitespace).
*/
exports.serializeStitched = function(tree,serialize,options) {
	options = options || {};
	var source = options.source;
	if(!source || typeof tree.start !== "number" || typeof tree.end !== "number") {
		return null;
	}
	var isBoundary = options.isBoundary || function(text) {
		return /^\s*$/.test(text);
	};
	// A pragma node's span ends at its own line while the chained children
	// extend beyond it, so advance by the deepest end
	function effectiveEnd(node) {
		var end = typeof node.end === "number" ? node.end : null;
		if(node.children && node.children.length) {
			var childEnd = effectiveEnd(node.children[node.children.length - 1]);
			if(childEnd !== null && (end === null || childEnd > end)) {
				end = childEnd;
			}
		}
		return end;
	}
	var pos = tree.start,
		result = "",
		valid = true;
	var appendBoundary = function(boundary) {
		if(!isBoundary(boundary)) {
			valid = false;
			return;
		}
		result += boundary;
	};
	$tw.utils.each(options.children || tree.children || [],function(child) {
		if(typeof child.start !== "number" || typeof child.end !== "number" || child.start < pos) {
			valid = false;
		}
		if(valid) {
			appendBoundary(source.substring(pos,child.start));
		}
		if(valid) {
			result += serialize(child);
			pos = effectiveEnd(child);
		}
		return valid;
	});
	if(valid) {
		appendBoundary(source.substring(pos,tree.end));
	}
	return valid ? result : null;
};

/*
Serialize the chained children of a pragma node, stitching the gaps between
them from the source, e.g. the single newline between two \function pragmas
that the fixed block joiner would widen to a blank line.
*/
exports.serializeChildren = function(tree,serialize,options) {
	options = options || {};
	var children = tree.children || [];
	if(!children.length) {
		return "";
	}
	var result = null;
	if(options.source) {
		result = exports.serializeStitched({start: children[0].start, end: children[children.length - 1].end, children: children},serialize,{source: options.source});
	}
	return result !== null ? result : serialize(children);
};

/*
Return the whitespace-only source text between two positions, or null, e.g.
the single newline between chained pragmas that the tree does not record.
*/
exports.recoverSourceGap = function(from,to,options) {
	options = options || {};
	var source = options.source;
	if(!source || typeof from !== "number" || typeof to !== "number" || to < from) {
		return null;
	}
	var gap = source.substring(from,to);
	return /^\s+$/.test(gap) ? gap : null;
};

/*
Quote a definition parameter default so the parameter regexes reparse it to
the same value, e.g. a default with spaces. Parens are excluded from the
plain form because ((v)) means an MVV reference.
options.allowBrackets: the macrodef regex also accepts the [[...]] form.
*/
exports.quoteParameterDefault = function(value,options) {
	options = options || {};
	if(/^[^,"'\s()]+$/.test(value)) {
		return value;
	}
	if(value.indexOf('"') === -1) {
		return '"' + value + '"';
	}
	if(value.indexOf("'") === -1) {
		return "'" + value + "'";
	}
	if(!options.allowBrackets || (value.indexOf('"""') === -1 && value.charAt(value.length - 1) !== '"')) {
		return '"""' + value + '"""';
	}
	return "[[" + value + "]]";
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
			// AST-only fallback: the plainest style that can hold the value
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
		if(!node.isMVV) {
			// The slice preserves the author's layout of a nested call, e.g.
			// d=<<d>> without the defensive space before the closing marker
			var sliceFragments = ["<<"];
			if(node.value && node.value.attributes && node.value.attributes["$variable"]) {
				sliceFragments.push(node.value.attributes["$variable"].value);
			}
			var macroSlice = exports.serializeFromSource(node,{source: options.source, fragments: sliceFragments});
			if(macroSlice !== null) {
				return macroSlice;
			}
		}
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
