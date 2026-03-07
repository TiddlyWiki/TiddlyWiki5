/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/list.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown list tokens
\*/

"use strict";

exports.bullet_list_open = {
	type: "bullet_list_open",
	isBlock: true,
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "ul",
			orderedAttributes: [],
			children: [],
			rule: "list"
		};
	}
};

exports.ordered_list_open = {
	type: "ordered_list_open",
	isBlock: true,
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "ol",
			orderedAttributes: [],
			children: [],
			rule: "list"
		};
	}
};

exports.list_item_open = {
	type: "list_item_open",
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "li",
			orderedAttributes: [],
			children: []
		};
	}
};

exports.list_item_close = {
	type: "list_item_close",
	isContainerClose: true,
	handler: function(token, context) {
		// Container close handler, actual pop happens in main loop
		return null;
	}
};

exports.bullet_list_close = {
	type: "bullet_list_close",
	isContainerClose: true,
	handler: function(token, context) {
		// Container close handler, actual pop happens in main loop
		return null;
	}
};

exports.ordered_list_close = {
	type: "ordered_list_close",
	isContainerClose: true,
	handler: function(token, context) {
		// Container close handler, actual pop happens in main loop
		return null;
	}
};