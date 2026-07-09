/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/quoteblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "quoteblock";

function isBoundary(text) {
	return /^\s*$/.test(text) || text.indexOf("<<<") !== -1;
}

/*
Fidelity path: the markers, their depth (<<< vs <<<<) and the class list only
exist in the source, so stitch the serialized children together with the
source text between them. The cite elements are ordinary children here.
*/
function serializeStitched(tree,serialize,options) {
	var source = options.source;
	if(!source || typeof tree.start !== "number" || typeof tree.end !== "number") {
		return null;
	}
	var pos = tree.start,
		result = "",
		valid = true;
	var appendBoundary = function(boundary) {
		if(!isBoundary(boundary)) {
			valid = false;
			return;
		}
		// Undo exactly the blank line joiner of block rules; a paragraph can
		// end with a real newline of its own that must survive
		if(result.slice(-2) === "\n\n") {
			result = result.replace(/\n\n$/,"");
		}
		result += boundary;
	};
	$tw.utils.each(tree.children || [],function(child) {
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

function isQuoteCite(node) {
	return !!(node && (node.isQuoteCite || (node.tag === "cite" && !node.rule)));
}

function serializeFromTree(tree,serialize) {
	// The first class in the class attribute is always the synthesized tc-quote
	var marker = tree.marker || "<<<",
		classes = tree.userClasses || (tree.attributes.class ? tree.attributes.class.value.split(" ").slice(1) : []),
		classText = classes.map(function(c) { return "." + c; }).join(""),
		children = tree.children ? tree.children.slice() : [],
		openingCite = "",
		closingCite = "";
	if(isQuoteCite(children[0])) {
		openingCite = " " + serialize(children.shift().children);
	}
	if(children.length && isQuoteCite(children[children.length - 1])) {
		closingCite = " " + serialize(children.pop().children);
	}
	var body = "";
	$tw.utils.each(children,function(child) {
		body += serialize(child);
	});
	return marker + classText + openingCite + "\n" + body.replace(/\n+$/,"") + "\n" + marker + closingCite;
}

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var result = serializeStitched(tree,serialize,options);
	if(result === null) {
		result = serializeFromTree(tree,serialize);
	}
	return result + "\n\n";
};
