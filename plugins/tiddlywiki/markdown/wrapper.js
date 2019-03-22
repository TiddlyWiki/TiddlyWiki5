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

var Remarkable = require('$:/plugins/midnight/remarkable/remarkable.js');

var md = new Remarkable();

function findTagWithType(nodes, startPoint, type) {
	for (var i = startPoint; i < nodes.length; i++) {
		if (nodes[i].type == type) {
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
function convertNodes(remarkableTree) {
	let out = [];

	function wrappedElement(elementTag, currentIndex, closingType, nodes) {
		var j = findTagWithType(nodes, currentIndex + 1, closingType);
		out.push({
			type: 'element',
			tag: elementTag,
			children: convertNodes(nodes.slice(currentIndex + 1, j))
		});
		return j;
	}

	for (var i = 0; i < remarkableTree.length; i++) {
		var currentNode = remarkableTree[i];
		if (currentNode.type == 'paragraph_open') {
			i = wrappedElement('p', i, 'paragraph_close', remarkableTree);
		} else if (currentNode.type == 'heading_open') {
			i = wrappedElement('h' + currentNode.hLevel, i, 'heading_close', remarkableTree);
		} else if (currentNode.type == 'bullet_list_open') {
			i = wrappedElement('ul', i, 'bullet_list_close', remarkableTree);
		} else if (currentNode.type == 'list_item_open') {
			i = wrappedElement('li', i, 'list_item_close', remarkableTree);
		} else if (currentNode.type == 'link_open') {
			var j = findTagWithType(remarkableTree, i + 1, 'link_close');

			if (currentNode.href.substr(0, 4) == 'http') {
				// External link
				out.push({
					type: 'element',
					tag: 'a',
					attributes: {
						href: { type: 'string', value: currentNode.href }
					},
					children: convertNodes(remarkableTree.slice(i + 1, j))
				});
			} else {
				// Internal link
				out.push({
				type: 'link',
				attributes: {
					to: {type: 'string', value: currentNode.href}
				},
				children: convertNodes(remarkableTree.slice(i + 1, j))
				});
			}
			i = j;
		} else if (currentNode.type.substr(currentNode.type.length - 5) == '_open') {
			var tagName = currentNode.type.substr(0, currentNode.type.length - 5);
			i = wrappedElement(tagName, i, tagName + '_close', remarkableTree);
			} else if (currentNode.type == 'code') {
			out.push({
				type: 'element',
				tag: currentNode.block ? 'pre' : 'code',
				children: [{type: 'text', text: currentNode.content}]
			});
		} else if (currentNode.type == 'fence') {
			out.push({
				type: 'codeblock',
				attributes: {
				language: { type: 'string', value: currentNode.params },
				code: { type: 'string', value: currentNode.content }
				}
			});
		} else if (currentNode.type == 'image') {
			out.push({
				type: 'image',
				attributes: {
				tooltip: { type: 'string', value: currentNode.alt },
				source: { type: 'string', value: currentNode.src }
				}
			});
		} else if (currentNode.type == 'inline') {
			out = out.concat(convertNodes(currentNode.children));
		} else if (currentNode.type == 'text') {
			let wikiParser = $tw.wiki.parseText('text/vnd.tiddlywiki', currentNode.content, {
				parseAsInline: false
			});

			if (wikiParser.tree.length == 1
				&& wikiParser.tree[0].type == 'element'
				&& wikiParser.tree[0].tag == 'p'
			) {
				out = out.concat(wikiParser.tree[0].children);
			} else {
				out = out.concat(wikiParser.tree);
			}
			} else {
			console.error('Unknown node type: ' + currentNode.type, currentNode);
			out.push({
				type: 'text',
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

	exports['text/x-markdown'] = MarkdownParser;

})();

