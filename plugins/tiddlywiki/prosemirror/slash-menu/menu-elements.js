/*\
title: $:/plugins/tiddlywiki/prosemirror/menu-elements.js
type: application/javascript
module-type: library

Exports functions to get all menu elements for SlashMenu (default + snippets)
\*/

"use strict";

function getSnippetMenuElements(wiki) {
	return wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/TextEditor/Snippet]]")
		.map(function(title) {
			var tiddler = wiki.getTiddler(title);
			if(!tiddler) return null;
			var label = tiddler.fields.caption || title;
			var snippetText = tiddler.fields.text;
			if(!snippetText) return null;
			return {
				id: "snippet-" + title,
				label: label,
				type: "command",
				available: function() { return true; },
				command: function(view) {
					var selection = view.state.selection;
					var tr = view.state.tr.insertText(snippetText, selection.from, selection.to);
					view.dispatch(tr);
					return true;
				}
			};
		});
}

function getBlockTypeMenuElements(schema) {
	var blockTypes = [
		{ id: "codeblock", label: "Turn into codeblock", node: schema.nodes.code_block },
		{ id: "blockquote", label: "Turn into quote", node: schema.nodes.blockquote },
		{ id: "paragraph", label: "Turn into paragraph", node: schema.nodes.paragraph }
	];
	var blockTypeCommands = blockTypes.map(function(item) {
		return {
			id: item.id,
			label: item.label,
			type: "command",
			available: function() { return true; },
			command: function(view) {
				var tr = view.state.tr.setBlockType(view.state.selection.from, view.state.selection.to, item.node);
				view.dispatch(tr);
				return true;
			}
		};
	});
	return [{
		id: "blocktype-submenu",
		label: "Block Type",
		type: "submenu",
		available: function() { return true; },
		elements: blockTypeCommands
	}];
}

function flattenMenuElementsWithGroup(elements) {
	var result = [];
	elements.forEach(function(item) {
		if(item.type === "submenu" && Array.isArray(item.elements)) {
			// Insert group title before submenu items
			result.push({
				id: "group-" + item.id,
				label: item.label,
				type: "group",
				available: function() { return true; }
			});
			result = result.concat(flattenMenuElementsWithGroup(item.elements));
		} else {
			result.push(item);
		}
	});
	return result;
}

exports.getAllMenuElements = function(wiki, schema) {
	return getSnippetMenuElements(wiki)
		.concat(getBlockTypeMenuElements(schema))
		.filter(function(item) { return !!item; });
};
exports.flattenMenuElementsWithGroup = flattenMenuElementsWithGroup;
