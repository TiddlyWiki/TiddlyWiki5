/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/inputrules.js
type: application/javascript
module-type: library

\*/

"use strict";

const inputRules = require("prosemirror-inputrules").inputRules;
const wrappingInputRule = require("prosemirror-inputrules").wrappingInputRule;
const textblockTypeInputRule = require("prosemirror-inputrules").textblockTypeInputRule;
const smartQuotes = require("prosemirror-inputrules").smartQuotes;
const emDash = require("prosemirror-inputrules").emDash;
const ellipsis = require("prosemirror-inputrules").ellipsis;
const wrappingListInputRule = require("prosemirror-flat-list").wrappingListInputRule;
const NodeType = require("prosemirror-model").NodeType;
const Schema = require("prosemirror-model").Schema;

function blockQuoteRule(nodeType) {
	return wrappingInputRule(/^\s*>\s$/, nodeType);
}

function codeBlockRule(nodeType) {
	return textblockTypeInputRule(/^```$/, nodeType);
}

function headingRule(nodeType, maxLevel) {
	return textblockTypeInputRule(new RegExp("^(\\!{1," + maxLevel + "}|\！{1," + maxLevel + "})\\s$"), nodeType, match => ({ level: match[1].length }));
}

function buildInputRules(schema) {
	var rules = smartQuotes.concat(ellipsis, emDash), type;
	type = schema.nodes.blockquote;
	if(type) {
		rules.push(blockQuoteRule(type));
	}
	type = schema.nodes.list;
	if(type) {
		rules.push(wrappingListInputRule(/^\s?([*-])\s$/, {
			kind: "bullet",
			collapsed: false
		}));
		rules.push(wrappingListInputRule(/^\s?(#)\s$|^\s?(\d+)\.\s$/, function(params) {
			var match = params.match;
			var order = match[1] === "#" ? 1 : parseInt(match[1], 10);
			return {
				kind: "ordered",
				collapsed: false,
				order: order != null && order >= 2 ? order : null
			};
		}));
	}
	type = schema.nodes.code_block;
	if(type) {
		rules.push(codeBlockRule(type));
	}
	type = schema.nodes.heading;
	if(type) {
		rules.push(headingRule(type, 6));
	}
	return inputRules({ rules: rules });
}
exports.buildInputRules = buildInputRules;
