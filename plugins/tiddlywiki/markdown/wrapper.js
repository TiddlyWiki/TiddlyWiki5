/*\
title: $:/plugins/tiddlywiki/markdown/wrapper.js
type: application/javascript
module-type: parser

Wraps up the remarkable parser for use as a Parser in TiddlyWiki

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var r = require("$:/plugins/tiddlywiki/markdown/remarkable.js");

var Remarkable = r.Remarkable,
	linkify = r.linkify,
	utils = r.utils;

///// Set up configuration options /////
function parseAsBoolean(tiddlerName) {
	return $tw.wiki.getTiddlerText(tiddlerName).toLowerCase() === "true";
}
var pluginOpts = {
	linkNewWindow: parseAsBoolean("$:/config/markdown/linkNewWindow"),
	renderWikiText: parseAsBoolean("$:/config/markdown/renderWikiText"),
	renderWikiTextPragma: $tw.wiki.getTiddlerText("$:/config/markdown/renderWikiTextPragma").trim()
};
var remarkableOpts = {
	breaks: parseAsBoolean("$:/config/markdown/breaks"),
	quotes: $tw.wiki.getTiddlerText("$:/config/markdown/quotes"),
	typographer: parseAsBoolean("$:/config/markdown/typographer")
};

var md = new Remarkable(remarkableOpts);

if (parseAsBoolean("$:/config/markdown/linkify")) {
	md = md.use(linkify);
}

function findTagWithType(nodes, startPoint, type, level) {
	for (var i = startPoint; i < nodes.length; i++) {
		if (nodes[i].type === type && nodes[i].level === level) {
			return i;
		}
	}
	return false;
}

/**
 * Remarkable creates nodes that look like:
 * [
 *   { type: 'paragraph_open'},
 *   { type: 'inline', content: 'Hello World', children:[{type: 'text', content: 'Hello World'}]},
 *   { type: 'paragraph_close'}
 * ]
 *
 * But TiddlyWiki wants the Parser (https://tiddlywiki.com/dev/static/Parser.html) to emit nodes like:
 *
 * [
 *   { type: 'element', tag: 'p', children: [{type: 'text', text: 'Hello World'}]}
 * ]
 */
function convertNodes(remarkableTree, isStartOfInline) {
	let out = [];

	function wrappedElement(elementTag, currentIndex, currentLevel, closingType, nodes) {
		var j = findTagWithType(nodes, currentIndex + 1, closingType, currentLevel);
		if (j === false) {
			console.error("Failed to find a " + closingType + " node after position " + currentIndex);
			console.log(nodes);
			return currentIndex + 1;
		}
		let children = convertNodes(nodes.slice(currentIndex + 1, j));

		out.push({
			type: "element",
			tag: elementTag,
			children: children
		});
		return j;
	}

	for (var i = 0; i < remarkableTree.length; i++) {
		var currentNode = remarkableTree[i];
		if (currentNode.type === "paragraph_open") {
			i = wrappedElement("p", i, currentNode.level, "paragraph_close", remarkableTree);
		} else if (currentNode.type === "heading_open") {
			i = wrappedElement("h" + currentNode.hLevel, i, currentNode.level, "heading_close", remarkableTree);
		} else if (currentNode.type === "bullet_list_open") {
			i = wrappedElement("ul", i, currentNode.level, "bullet_list_close", remarkableTree);
		} else if (currentNode.type == 'ordered_list_open') {
			i = wrappedElement('ol', i, currentNode.level,'ordered_list_close', remarkableTree);
		} else if (currentNode.type === "list_item_open") {
			i = wrappedElement("li", i, currentNode.level, "list_item_close", remarkableTree);
		} else if (currentNode.type === "link_open") {
			var j = findTagWithType(remarkableTree, i + 1, "link_close", currentNode.level);

			if (currentNode.href[0] !== "#") {
				// External link
				var attributes = {
					href: { type: "string", value: currentNode.href }
				};
				if (pluginOpts.linkNewWindow) {
					attributes.target = { type: "string", value: "_blank" };
				}
				out.push({
					type: "element",
					tag: "a",
					attributes: attributes,
					children: convertNodes(remarkableTree.slice(i + 1, j))
				});
			} else {
				// Internal link
				out.push({
					type: "link",
					attributes: {
						to: { type: "string", value: decodeURI(currentNode.href.substr(1)) }
					},
					children: convertNodes(remarkableTree.slice(i + 1, j))
				});
			}
			i = j;
		} else if (currentNode.type.substr(currentNode.type.length - 5) === "_open") {
			var tagName = currentNode.type.substr(0, currentNode.type.length - 5);
			i = wrappedElement(tagName, i, currentNode.level, tagName + "_close", remarkableTree);
		} else if (currentNode.type === "code") {
			out.push({
				type: "element",
				tag: currentNode.block ? "pre" : "code",
				children: [{ type: "text", text: currentNode.content }]
			});
		} else if (currentNode.type === "fence") {
			out.push({
				type: "codeblock",
				attributes: {
					language: { type: "string", value: currentNode.params },
					code: { type: "string", value: currentNode.content }
				}
			});
		} else if (currentNode.type === "image") {
			out.push({
				type: "image",
				attributes: {
					tooltip: { type: "string", value: currentNode.alt },
					source: { type: "string", value: currentNode.src }
				}
			});
		} else if (currentNode.type === "softbreak") {
			out.push({
				type: "element",
				tag: "br",
			});
		} else if (currentNode.type == 'hr') {
			out.push({
				type: 'element',
				tag: 'hr',
			});
		} else if (currentNode.type === "inline") {
			out = out.concat(convertNodes(currentNode.children, true));
		} else if (currentNode.type === "text") {
			if (!pluginOpts.renderWikiText) {
				out.push({
					type: "text",
					text: currentNode.content
				});
			} else {
				// The Markdown compiler thinks this is just text.
				// Hand off to the WikiText parser to see if there's more to render

				// If we're inside a block element (div, p, td, h1), and this is the first child in the tree,
				// handle as a block-level parse. Otherwise not.
				var parseAsInline = !(isStartOfInline && i === 0);
				var textToParse = currentNode.content;
				if (pluginOpts.renderWikiTextPragma !== "") {
					textToParse = pluginOpts.renderWikiTextPragma + "\n" + textToParse;
				}
				var wikiParser = $tw.wiki.parseText("text/vnd.tiddlywiki", textToParse, {
					parseAsInline: parseAsInline
				});
				var rs = wikiParser.tree;

				// If we parsed as a block, but the root element the WikiText parser gave is a paragraph,
				// we should discard the paragraph, since the way Remarkable nests its nodes, this "inline"
				// node is always inside something else that's a block-level element
				if (!parseAsInline
					&& rs.length === 1
					&& rs[0].type === "element"
					&& rs[0].tag === "p"
				) {
					rs = rs[0].children;
				}

				// If the original text element started with a space, add it back in
				if (rs.length > 0
					&& rs[0].type === "text"
					&& currentNode.content[0] === " "
				) {
					rs[0].text = " " + rs[0].text;
				}
				out = out.concat(rs);
			}
		} else {
			console.error("Unknown node type: " + currentNode.type, currentNode);
			out.push({
				type: "text",
				text: currentNode.content
			});
		}
	}
	return out;
}

var MarkdownParser = function(type, text, options) {
	var tree = md.parse(text, {});
	//console.debug(tree);
	tree = convertNodes(tree);
	//console.debug(tree);

	this.tree = tree;
};

exports["text/x-markdown"] = MarkdownParser;

})();
