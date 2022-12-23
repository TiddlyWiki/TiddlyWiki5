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
var accumulatingTypes = {
	"text": true,
	"softbreak": true
};
// If rendering WikiText, we treat katex nodes as text.
if(pluginOpts.renderWikiText) {
	accumulatingTypes["katex"] = true;
}

var md = new Remarkable(remarkableOpts);

// If tiddlywiki/katex plugin is present, use remarkable-katex to enable katex support.
if($tw.modules.titles["$:/plugins/tiddlywiki/katex/katex.min.js"]) {
	var rk = require("$:/plugins/tiddlywiki/markdown/remarkable-katex.js");
	md = md.use(rk);
}

if(parseAsBoolean("$:/config/markdown/linkify")) {
	md = md.use(linkify);
}

function findTagWithType(nodes, startPoint, type, level) {
	for (var i = startPoint; i < nodes.length; i++) {
		if(nodes[i].type === type && nodes[i].level === level) {
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
	var accumulatedText = '';
	function withChildren(currentIndex, currentLevel, closingType, nodes, callback) {
		var j = findTagWithType(nodes, currentIndex + 1, closingType, currentLevel);
		if(j === false) {
			console.error("Failed to find a " + closingType + " node after position " + currentIndex);
			console.log(nodes);
			return currentIndex + 1;
		}
		let children = convertNodes(nodes.slice(currentIndex + 1, j));
		callback(children);
		return j;
	}
	function wrappedElement(elementTag, currentIndex, currentLevel, closingType, nodes) {
		return withChildren(currentIndex, currentLevel, closingType, nodes, function(children) {
			out.push({
				type: "element",
				tag: elementTag,
				children: children
			});
		});
	}

	for (var i = 0; i < remarkableTree.length; i++) {
		var currentNode = remarkableTree[i];
		switch (currentNode.type) {
		case "paragraph_open":
			// If the paragraph is a "tight" layout paragraph, don't wrap children in a <p> tag.
			if(currentNode.tight) {
				i = withChildren(i, currentNode.level, "paragraph_close", remarkableTree, function(children) {
					Array.prototype.push.apply(out, children);
				});
			} else {
				i = wrappedElement("p", i, currentNode.level, "paragraph_close", remarkableTree);
			}
			break;

		case "heading_open":
			i = wrappedElement("h" + currentNode.hLevel, i, currentNode.level, "heading_close", remarkableTree);
			break;

		case "bullet_list_open":
			i = wrappedElement("ul", i, currentNode.level, "bullet_list_close", remarkableTree);
			break;

		case "ordered_list_open":
			i = wrappedElement('ol', i, currentNode.level,'ordered_list_close', remarkableTree);
			break;

		case "list_item_open":
			i = wrappedElement("li", i, currentNode.level, "list_item_close", remarkableTree);
			break;

		case "link_open":
			i = withChildren(i, currentNode.level, "link_close", remarkableTree, function(children) {
				if(currentNode.href[0] !== "#") {
					// External link
					var attributes = {
						class: { type: "string", value: "tc-tiddlylink-external" },
						href: { type: "string", value: currentNode.href },
						rel: { type: "string", value: "noopener noreferrer" }
					};
					if(pluginOpts.linkNewWindow) {
						attributes.target = { type: "string", value: "_blank" };
					}
					out.push({
						type: "element",
						tag: "a",
						attributes: attributes,
						children: children
					});
				} else {
					// Internal link
					out.push({
						type: "link",
						attributes: {
							to: { type: "string", value: $tw.utils.decodeURISafe(currentNode.href.substr(1)) }
						},
						children: children
					});
				}
			});
			break;

		case "code":
			out.push({
				type: "element",
				tag: currentNode.block ? "pre" : "code",
				children: [{ type: "text", text: currentNode.content }]
			});
			break;

		case "fence":
			out.push({
				type: "codeblock",
				attributes: {
					language: { type: "string", value: currentNode.params },
					code: { type: "string", value: currentNode.content }
				}
			});
			break;

		case "image":
			out.push({
				type: "image",
				attributes: {
					tooltip: { type: "string", value: currentNode.alt },
					source: { type: "string", value: $tw.utils.decodeURIComponentSafe(currentNode.src) }
				}
			});
			break;

		case "softbreak":
			if(remarkableOpts.breaks) {
				out.push({
					type: "element",
					tag: "br",
				});
			} else {
				accumulatedText = accumulatedText + '\n';
			}
			break;

		case "hardbreak":
			out.push({
				type: "element",
				tag: "br",
			});
			break;

		case "th_open":
		case "td_open":
			var elementTag = currentNode.type.slice(0, 2);
			i = withChildren(i, currentNode.level, elementTag + "_close", remarkableTree, function(children) {
				var attributes = {};
				if(currentNode.align) {
					attributes.style = { type: "string", value: "text-align:" + currentNode.align };
				}
				out.push({
					type: "element",
					tag: elementTag,
					attributes: attributes,
					children: children
				});
			});
			break;

		case "hr":
			out.push({
				type: 'element',
				tag: 'hr',
			});
			break;

		case "inline":
			out = out.concat(convertNodes(currentNode.children, true));
			break;

		case "text":
			// We need to merge this text block with the upcoming text block and parse it all together.
			accumulatedText = accumulatedText + currentNode.content;
			break;

		case "katex":
			// If rendering WikiText, convert the katex node back to text for parsing by the WikiText LaTeX parser.
			if(pluginOpts.renderWikiText) {
				// If this is a block, add a newline to trigger the KaTeX plugins block detection.
				var displayModeSuffix = currentNode.block ? "\n" : "";
				accumulatedText = accumulatedText + "$$" + currentNode.content + displayModeSuffix + "$$";
			} else {
				out.push({
					type: "latex",
					attributes: {
						text: { type: "text", value: currentNode.content },
						displayMode: { type: "text", value: currentNode.block ? "true" : "false" }
					}
				});
			}
			break;

		default:
			if(currentNode.type.substr(currentNode.type.length - 5) === "_open") {
				var tagName = currentNode.type.substr(0, currentNode.type.length - 5);
				i = wrappedElement(tagName, i, currentNode.level, tagName + "_close", remarkableTree);
			} else {
				console.error("Unknown node type: " + currentNode.type, currentNode);
				out.push({
					type: "text",
					text: currentNode.content
				});
			}
			break;
		}
		// We test to see if we process the block now, or if there's
		// more to accumulate first.
		if(accumulatedText
			&& (
				remarkableOpts.breaks ||
				(i+1) >= remarkableTree.length ||
				!accumulatingTypes[remarkableTree[i+1].type]
			)
		) {
			// The Markdown compiler thinks this is just text.
			// Hand off to the WikiText parser to see if there's more to render
			// But only if it's configured to, and we have more than whitespace
			if(!pluginOpts.renderWikiText || accumulatedText.match(/^\s*$/)) {
				out.push({
					type: "text",
					text: accumulatedText
				});
			} else {
				// If we're inside a block element (div, p, td, h1), and this is the first child in the tree,
				// handle as a block-level parse. Otherwise not.
				var parseAsInline = !(isStartOfInline && i === 0);
				var textToParse = accumulatedText;
				if(pluginOpts.renderWikiTextPragma !== "") {
					textToParse = pluginOpts.renderWikiTextPragma + "\n" + textToParse;
				}
				var wikiParser = $tw.wiki.parseText("text/vnd.tiddlywiki", textToParse, {
					parseAsInline: parseAsInline
				});
				var rs = wikiParser.tree;

				// If we parsed as a block, but the root element the WikiText parser gave is a paragraph,
				// we should discard the paragraph, since the way Remarkable nests its nodes, this "inline"
				// node is always inside something else that's a block-level element
				if(!parseAsInline
					&& rs.length === 1
					&& rs[0].type === "element"
					&& rs[0].tag === "p"
				) {
					rs = rs[0].children;
				}

				// If the original text element started with a space, add it back in
				if(rs.length > 0
					&& rs[0].type === "text"
					&& (accumulatedText[0] === " " || accumulatedText[0] === "\n")
				) {
					rs[0].text = " " + rs[0].text;
				}
				out = out.concat(rs);
			}
			accumulatedText = '';
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
