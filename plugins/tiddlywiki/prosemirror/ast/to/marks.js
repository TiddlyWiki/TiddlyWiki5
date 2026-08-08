/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/marks.js
type: application/javascript
module-type: library
\*/

"use strict";

const buildTextWithMark = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildTextWithMark;

exports.buildStrong = function buildStrong(context, node) {
	return buildTextWithMark(context, node, "strong");
};

exports.buildEm = function buildEm(context, node) {
	return buildTextWithMark(context, node, "em");
};

exports.buildCode = function buildCode(context, node) {
	return buildTextWithMark(context, node, "code");
};

exports.buildUnderline = function buildUnderline(context, node) {
	return buildTextWithMark(context, node, "underline");
};

exports.buildStrike = function buildStrike(context, node) {
	return buildTextWithMark(context, node, "strike");
};

exports.buildSup = function buildSup(context, node) {
	return buildTextWithMark(context, node, "superscript");
};

exports.buildSub = function buildSub(context, node) {
	return buildTextWithMark(context, node, "subscript");
};
