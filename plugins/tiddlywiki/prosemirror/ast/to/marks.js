/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/marks.js
type: application/javascript
module-type: library
\*/

"use strict";

const buildTextWithMark = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildTextWithMark;
const factory = $tw.utils.wikitextParseTree;

// The factory's emphasis kind to the ProseMirror mark type
const markTypes = {
	bold: "strong",
	italic: "em",
	code: "code",
	underscore: "underline",
	strikethrough: "strike",
	superscript: "superscript",
	subscript: "subscript"
};

exports.buildEmphasis = function buildEmphasis(context, node) {
	return buildTextWithMark(context, node, markTypes[factory.emphasisKind(node)]);
};

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
