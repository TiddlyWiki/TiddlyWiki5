/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/conditional.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "conditional";

/*
An elseif clause is a list widget synthesized by parseIfClause: it carries
the isConditional flag but no rule name, unlike a real nested conditional
or a $list widget in an else body
*/
function isElseIfClause(node) {
	return !!(node && node.isConditional && !node.rule);
}

/*
Collect the body children of every clause in document order
*/
function collectBodies(listNode,out) {
	$tw.utils.each(listNode.children[0].children || [],function(child) {
		out.push(child);
	});
	var next = listNode.children[1] && listNode.children[1].children;
	if(next && next.length) {
		if(next.length === 1 && isElseIfClause(next[0])) {
			collectBodies(next[0],out);
		} else {
			$tw.utils.each(next,function(child) {
				out.push(child);
			});
		}
	}
}

/*
Fidelity path: the clause markers only exist in the source, so stitch the
serialized clause bodies together with the source text between them. Returns
null when there is no source or a boundary does not look like markers or
whitespace, e.g. for a mutated tree.
*/
function serializeStitched(tree,serialize,options) {
	var source = options.source;
	if(!source || typeof tree.start !== "number" || typeof tree.end !== "number") {
		return null;
	}
	var children = [];
	collectBodies(tree,children);
	var isBoundary = function(text) {
		return /^\s*$/.test(text) || (text.indexOf("<%") !== -1 && text.indexOf("%>") !== -1);
	};
	var pos = tree.start,
		result = "",
		valid = true;
	var appendBoundary = function(boundary) {
		if(!isBoundary(boundary)) {
			valid = false;
			return;
		}
		// Undo the fixed blank line joiner of block rules; the boundary
		// carries the true separator from the source
		if(result.slice(-2) === "\n\n") {
			result = result.replace(/\n+$/,"");
		}
		result += boundary;
	};
	$tw.utils.each(children,function(child) {
		if(typeof child.start !== "number" || typeof child.end !== "number" || child.start < pos) {
			valid = false;
		}
		if(valid) {
			appendBoundary(source.substring(pos,child.start));
		}
		if(valid) {
			result += serialize(child);
			pos = child.end;
		}
		return valid;
	});
	if(valid) {
		appendBoundary(source.substring(pos,tree.end));
	}
	return valid ? result : null;
}

function serializeFromTree(tree,serialize) {
	var result = "<%if " + tree.attributes.filter.value + "%>" + serialize(tree.children[0].children);
	var node = tree;
	while(true) {
		var next = node.children[1] && node.children[1].children;
		if(!next || !next.length) {
			break;
		}
		if(next.length === 1 && isElseIfClause(next[0])) {
			node = next[0];
			result += "<%elseif " + node.attributes.filter.value + "%>" + serialize(node.children[0].children);
		} else {
			result += "<%else%>" + serialize(next);
			break;
		}
	}
	return result + "<%endif%>";
}

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var result = serializeStitched(tree,serialize,options);
	if(result === null) {
		result = serializeFromTree(tree,serialize);
	}
	if(tree.isBlock) {
		result += "\n\n";
	}
	return result;
};
