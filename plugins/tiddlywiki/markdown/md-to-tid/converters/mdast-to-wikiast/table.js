/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/table.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Markdown table handlers
\*/

"use strict";

exports.table_open = {
	type: "table_open",
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "table",
			rule: "table",
			orderedAttributes: [],
			children: []
		};
	}
};

exports.table_close = {
	type: "table_close",
	isContainerClose: true,
	handler: function() {}
};

exports.thead_open = {
	type: "thead_open",
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "thead",
			orderedAttributes: [],
			children: []
		};
	}
};

exports.thead_close = {
	type: "thead_close",
	isContainerClose: true,
	handler: function() {}
};

exports.tbody_open = {
	type: "tbody_open",
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "tbody",
			orderedAttributes: [],
			children: []
		};
	}
};

exports.tbody_close = {
	type: "tbody_close",
	isContainerClose: true,
	handler: function() {}
};

exports.tr_open = {
	type: "tr_open",
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "tr",
			orderedAttributes: [],
			children: []
		};
	}
};

exports.tr_close = {
	type: "tr_close",
	isContainerClose: true,
	handler: function() {}
};

exports.th_open = {
	type: "th_open",
	isContainer: true,
	handler: function(token, context) {
		const align = token.attrGet && token.attrGet("style");
		const orderedAttributes = [];
		
		if(align) {
			orderedAttributes.push({
				name: "align",
				type: "string",
				value: align.includes("left") ? "left" : align.includes("right") ? "right" : align.includes("center") ? "center" : ""
			});
		}
		
		return {
			type: "element",
			tag: "th",
			orderedAttributes: orderedAttributes,
			children: []
		};
	}
};

exports.th_close = {
	type: "th_close",
	isContainerClose: true,
	handler: function() {}
};

exports.td_open = {
	type: "td_open",
	isContainer: true,
	handler: function(token, context) {
		const align = token.attrGet && token.attrGet("style");
		const orderedAttributes = [];
		
		if(align) {
			orderedAttributes.push({
				name: "align",
				type: "string",
				value: align.includes("left") ? "left" : align.includes("right") ? "right" : align.includes("center") ? "center" : ""
			});
		}
		
		return {
			type: "element",
			tag: "td",
			orderedAttributes: orderedAttributes,
			children: []
		};
	}
};

exports.td_close = {
	type: "td_close",
	isContainerClose: true,
	handler: function() {}
};