/*\
title: $:/plugins/tiddlywiki/prosemirror/setup/inputrules.js
type: application/javascript
module-type: library

\*/

"use strict";

var { inputRules, wrappingInputRule, textblockTypeInputRule, smartQuotes, emDash, ellipsis } = require("prosemirror-inputrules");
var { NodeType, Schema } = require("prosemirror-model");

function blockQuoteRule(nodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

function orderedListRule(nodeType) {
  return wrappingInputRule(/^(\d+)\.\s$/, nodeType, function(match) { return { order: +match[1] }; },
                           function(match, node) { return node.childCount + node.attrs.order == +match[1]; });
}

function bulletListRule(nodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

function codeBlockRule(nodeType) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

function headingRule(nodeType, maxLevel) {
  return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, function(match) { return { level: match[1].length }; });
}

function buildInputRules(schema) {
  var rules = smartQuotes.concat(ellipsis, emDash), type;
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type));
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type));
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type));
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type));
  if (type = schema.nodes.heading) rules.push(headingRule(type, 6));
  return inputRules({ rules: rules });
}

exports.buildInputRules = buildInputRules;
