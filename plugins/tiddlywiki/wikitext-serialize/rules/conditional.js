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

function serializeFromTree(tree,serialize) {
	// A blank line after a clause marker switches the body to block mode
	var bodyGap = function(container) {
		return container && container.blockContent ? "\n\n" : "";
	};
	// A block body ends at its content; the following marker needs its line
	var markerGap = function(container) {
		return container && container.blockContent ? "\n" : "";
	};
	var result = "<%if " + tree.attributes.filter.value + "%>" + bodyGap(tree.children[0]) + serialize(tree.children[0].children);
	var node = tree,
		lastContainer = tree.children[0];
	while(true) {
		var next = node.children[1] && node.children[1].children;
		if(!next || !next.length) {
			break;
		}
		if(next.length === 1 && isElseIfClause(next[0])) {
			node = next[0];
			result += markerGap(lastContainer) + "<%elseif " + node.attributes.filter.value + "%>" + bodyGap(node.children[0]) + serialize(node.children[0].children);
			lastContainer = node.children[0];
		} else {
			result += markerGap(lastContainer) + "<%else%>" + bodyGap(node.children[1]) + serialize(next);
			lastContainer = node.children[1];
			break;
		}
	}
	return result + markerGap(lastContainer) + "<%endif%>";
}

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The clause markers only exist in the source between the clause bodies
	var children = [];
	collectBodies(tree,children);
	var result = $tw.utils.serializeStitched(tree,serialize,{
		source: options.source,
		children: children,
		isBoundary: function(text) {
			return /^\s*$/.test(text) || (text.indexOf("<%") !== -1 && text.indexOf("%>") !== -1);
		}
	});
	if(result === null) {
		result = serializeFromTree(tree,serialize);
	}
	return result;
};
