/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/text.js
type: application/javascript
module-type: library
\*/

"use strict";

const markTypeMap = {
	strong: "strong",
	em: "em",
	code: "code",
	underline: "u",
	strike: "s",
	superscript: "sup",
	subscript: "sub"
};

const markRuleMap = {
	em: "italic",
	strong: "bold",
	code: "codeinline",
	underline: "underscore",
	strike: "strikethrough",
	superscript: "superscript",
	subscript: "subscript"
};

const markPriority = ["code", "strong", "bold", "em", "italic", "underline", "strike", "strikethrough", "superscript", "subscript", "link"];

module.exports = function text(builders, node) {
	if(!node.text) {
		return { type: "text", text: "" };
	}
	if(node.marks && node.marks.length > 0) {
		const textNode = { type: "text", text: node.text };
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
				const isExternal = /^(?:https?|ftp|mailto):/i.test(href);
				const displayText = wrappedNode.text || "";
				if(isExternal && displayText && displayText !== href) {
					return {
						type: "link",
						rule: "prettylink",
						attributes: {
							to: { type: "string", value: href }
						},
						children: [wrappedNode]
					};
				}
				if(isExternal) {
					return {
						type: "element",
						tag: "a",
						rule: "prettyextlink",
						attributes: {
							class: { type: "string", value: "tc-tiddlylink-external" },
							href: { type: "string", value: href },
							target: { type: "string", value: "_blank" },
							rel: { type: "string", value: "noopener noreferrer" }
						},
						children: [wrappedNode]
					};
				}
				return {
					type: "link",
					rule: "prettylink",
					attributes: {
						to: { type: "string", value: href }
					},
					children: [wrappedNode]
				};
			}
			const tag = markTypeMap[mark.type];
			const rule = markRuleMap[mark.type];
			if(!tag) {
				return wrappedNode;
			}
			return {
				type: "element",
				tag: tag,
				rule: rule,
				children: [wrappedNode]
			};
		}, textNode);
	}
	return {
		type: "text",
		text: node.text
	};
};
