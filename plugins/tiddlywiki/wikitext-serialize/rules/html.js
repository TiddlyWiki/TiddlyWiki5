/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/html.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "html";

/*
Fragments that must survive in a sliced opening tag; a mutated attribute
makes the slice untrustworthy
*/
function attributeFragments(tree) {
	var fragments = [tree.tag];
	$tw.utils.each(tree.orderedAttributes,function(attribute) {
		fragments.push(attribute.name);
		if(attribute.type === "string" && attribute.value !== "true") {
			fragments.push(attribute.value);
		} else if(attribute.type === "indirect") {
			fragments.push(attribute.textReference);
		} else if(attribute.type === "filtered") {
			fragments.push(attribute.filter);
		} else if(attribute.type === "substituted") {
			fragments.push(attribute.rawValue);
		}
	});
	return fragments;
}

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var source = options.source;
	var tag = tree.tag;
	// Reproduce the opening tag from the source to preserve the attribute
	// layout, e.g. attributes indented on their own lines
	var openTag = null;
	if(typeof tree.openTagStart === "number" && typeof tree.openTagEnd === "number") {
		openTag = $tw.utils.serializeFromSource({start: tree.openTagStart, end: tree.openTagEnd},{source: source, fragments: attributeFragments(tree)});
	}
	if(openTag === null) {
		var attributes = tree.orderedAttributes.map(function(attribute) {
			return $tw.utils.serializeAttribute(attribute,options);
		}).join(" ");
		openTag = "<" + tag + (attributes ? " " + attributes : "") + (tree.isSelfClosing ? "/>" : ">");
	}
	var isVoidElement = $tw.config.htmlVoidElements.indexOf(tag) !== -1;
	var result;
	if(tree.isSelfClosing || isVoidElement) {
		result = openTag;
	} else {
		// Stitch the children with the whitespace-only gaps that exist only
		// in the source: line breaks eaten by \whitespace trim and the blank
		// line that switches the content to block mode
		var inner = null;
		if(typeof tree.openTagEnd === "number" && typeof tree.closeTagStart === "number") {
			inner = $tw.utils.serializeStitched({start: tree.openTagEnd, end: tree.closeTagStart, children: tree.children},serialize,{source: source});
		}
		// An implicit close tag (closeTagStart equals closeTagEnd) is not written out
		var hasCloseTag = !(typeof tree.closeTagStart === "number" && tree.closeTagStart === tree.closeTagEnd);
		if(inner === null) {
			inner = serialize(tree.children || []);
			if(tree.blockContent) {
				// The blank line after the open tag switches the content to block mode
				inner = "\n\n" + inner;
				// The close tag needs its own line, or a final line-terminated
				// child like a heading would swallow it
				if(hasCloseTag && inner.slice(-1) !== "\n") {
					inner += "\n";
				}
			}
		}
		result = openTag + inner + (hasCloseTag ? "</" + tag + ">" : "");
	}
	return result;
};
