/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/inputrules.js
type: application/javascript
module-type: library

\*/

"use strict";

var { inputRules, wrappingInputRule, textblockTypeInputRule, smartQuotes, emDash, ellipsis } = require("prosemirror-inputrules");
var { wrappingListInputRule } = require("prosemirror-flat-list");
var { NodeType, Schema } = require("prosemirror-model");

function blockQuoteRule(nodeType) {
	return wrappingInputRule(/^\s*>\s$/, nodeType);
}

function codeBlockRule(nodeType) {
	return textblockTypeInputRule(/^```$/, nodeType);
}

function headingRule(nodeType, maxLevel) {
	return textblockTypeInputRule(new RegExp("^(\\!{1," + maxLevel + "}|\！{1," + maxLevel + "})\\s$"), nodeType, function(match) { return { level: match[1].length }; });
}

function buildInputRules(schema) {
	var rules = smartQuotes.concat(ellipsis, emDash), type;
	if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type));
	if (type = schema.nodes.list) {
		rules.push(wrappingListInputRule(/^\s?([*-])\s$/, {
			kind: 'bullet',
			collapsed: false,
		}));
		rules.push(wrappingListInputRule(/^\s?(#)\s$|^\s?(\d+)\.\s$/, ({ match }) => {
			const order = match[1] === "#" ? 1 : parseInteger(match[1]);
			return {
				kind: 'ordered',
				collapsed: false,
				order: order != null && order >= 2 ? order : null,
			};
		}));
	}
	if (type = schema.nodes.code_block) rules.push(codeBlockRule(type));
	if (type = schema.nodes.heading) rules.push(headingRule(type, 6));
	return inputRules({ rules: rules });
}
exports.buildInputRules = buildInputRules;
