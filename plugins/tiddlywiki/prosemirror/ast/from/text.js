/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/text.js
type: application/javascript
module-type: library
\*/

"use strict";

const factory = $tw.utils.wikitextParseTree;

// ProseMirror mark type to the factory's emphasis kind
const markKinds = {
	strong: "bold",
	em: "italic",
	code: "code",
	underline: "underscore",
	strike: "strikethrough",
	superscript: "superscript",
	subscript: "subscript"
};

const markPriority = ["code", "strong", "bold", "em", "italic", "underline", "strike", "strikethrough", "superscript", "subscript", "link"];

module.exports = function text(builders, node) {
	if(!node.text) {
		return factory.text("");
	}
	if(node.marks && node.marks.length > 0) {
		const sortedMarks = node.marks.slice().sort((a, b) => {
			const indexA = markPriority.indexOf(a.type);
			const indexB = markPriority.indexOf(b.type);
			if(indexA === -1) return 1;
			if(indexB === -1) return -1;
			return indexA - indexB;
		});
		return sortedMarks.reduce((wrappedNode, mark) => {
			if(mark.type === "link") {
				const href = mark.attrs && mark.attrs.href || "";
				if(/^(?:https?|ftp|mailto):/i.test(href)) {
					return factory.externalLink(href, [wrappedNode]);
				}
				return factory.link(href, [wrappedNode]);
			}
			const kind = markKinds[mark.type];
			return kind ? factory.emphasis(kind, [wrappedNode]) : wrappedNode;
		}, factory.text(node.text));
	}
	return factory.text(node.text);
};
