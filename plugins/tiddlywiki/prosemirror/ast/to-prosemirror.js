/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js
type: application/javascript
module-type: library

Get the Prosemirror AST from a Wiki AST

\*/

function buildParagraph(context, node) {
	return {
		type: "paragraph",
		content: convertNodes(context, node.children)
	};
}

function buildHeading(context, node, level) {
	return {
		type: "heading",
		attrs: { level: level },
		content: convertNodes(context, node.children)
	};
}

function buildUnorderedList(context, node) {
	// Prosemirror requires split all lists into separate lists with single items
	return node.children.map(item => {
		const newContext = {};
		for(const key in context) {
			if(context.hasOwnProperty(key)) {
				newContext[key] = context[key];
			}
		}
		newContext.level = context.level + 1;
		const processedItem = convertANode(newContext, item);
		return {
			type: "list",
			attrs: {
				kind: "bullet",
				order: null,
				checked: false,
				collapsed: false
			},
			content: processedItem
		};
	});
}

function buildOrderedList(context, node) {
	return node.children.map(item => {
		const newContext = {};
		for(const key in context) {
			if(context.hasOwnProperty(key)) {
				newContext[key] = context[key];
			}
		}
		newContext.level = context.level + 1;
		const processedItem = convertANode(newContext, item);
		return {
			type: "list",
			attrs: {
				kind: "ordered",
				order: null,
				checked: false,
				collapsed: false
			},
			content: processedItem
		};
	});
}


/**
 * Helper function to ensure text nodes in list items are wrapped in paragraphs
 * ProseMirror requires list items to contain block content, not bare text
 */
function wrapTextNodesInParagraphs(context, nodes) {
	if(!nodes || nodes.length === 0) {
		return [];
	}

	let result = [];
	let currentTextNodes = [];

	const flushTextNodes = () => {
		if(currentTextNodes.length > 0) {
			result.push({
				type: "paragraph",
				content: currentTextNodes
			});
			currentTextNodes = [];
		}
	};

	nodes.forEach(node => {
		// If it's a text node, collect it
		if(node.type === "text") {
			currentTextNodes.push(node);
		} else {
			// If we encounter a non-text node, flush any collected text nodes
			flushTextNodes();
			// Add the non-text node as is
			result.push(node);
		}
	});

	// Flush any remaining text nodes
	flushTextNodes();

	return result;
}

function buildListItem(context, node) {
	const newContext = {};
	for(const key in context) {
		if(context.hasOwnProperty(key)) {
			newContext[key] = context[key];
		}
	}
	newContext.level = context.level + 1;
	const processedContent = convertNodes(newContext, node.children);
	// Ensure content starts with a block element (typically paragraph)
	return wrapTextNodesInParagraphs(context, processedContent);
}

function buildTextWithMark(context, node, markType) {
	const content = convertNodes(context, node.children);
	return content.map(childNode => {
		if(childNode.type === "text") {
			// Add the mark to the text node
			const marks = childNode.marks || [];
			const newMarks = marks.slice();
			newMarks.push({ type: markType });
			const result = {};
			for(const key in childNode) {
				if(childNode.hasOwnProperty(key)) {
					result[key] = childNode[key];
				}
			}
			result.marks = newMarks;
			return result;
		}
		return childNode;
	});
}

function buildStrong(context, node) {
	return buildTextWithMark(context, node, "strong");
}

function buildEm(context, node) {
	return buildTextWithMark(context, node, "em");
}

function buildCode(context, node) {
	return buildTextWithMark(context, node, "code");
}

function buildUnderline(context, node) {
	return buildTextWithMark(context, node, "underline");
}

function buildStrike(context, node) {
	return buildTextWithMark(context, node, "strike");
}

function buildSup(context, node) {
	return buildTextWithMark(context, node, "superscript");
}

function buildSub(context, node) {
	return buildTextWithMark(context, node, "subscript");
}

function buildCodeBlock(context, node) {
	// Extract text content from the code element inside pre
	let codeElement = null;
	if(node.children && node.children.length > 0) {
		for(let i = 0; i < node.children.length; i++) {
			if(node.children[i].tag === "code") {
				codeElement = node.children[i];
				break;
			}
		}
	}
	if(codeElement && codeElement.children) {
		let textContent = "";
		for(let j = 0; j < codeElement.children.length; j++) {
			if(codeElement.children[j].type === "text") {
				textContent += codeElement.children[j].text;
			}
		}
		return {
			type: "code_block",
			content: [{
				type: "text",
				text: textContent
			}]
		};
	}
	// Fallback: extract all text from children
	let fallbackText = "";
	if(node.children) {
		for(let k = 0; k < node.children.length; k++) {
			if(node.children[k].type === "text") {
				fallbackText += node.children[k].text;
			}
		}
	}
	return {
		type: "code_block",
		content: [{
			type: "text",
			text: fallbackText
		}]
	};
}

function buildBlockquote(context, node) {
	// Extract cite text if present (<<<text\n<<<cite)
	var citeText = null;
	var bodyChildren = [];
	var children = node.children || [];
	for(var ci = 0; ci < children.length; ci++) {
		if(children[ci].type === "element" && children[ci].tag === "cite") {
			// Serialize cite children to plain text
			citeText = extractPlainText(children[ci]);
		} else {
			bodyChildren.push(children[ci]);
		}
	}
	return {
		type: "blockquote",
		attrs: { cite: citeText },
		content: convertNodes(context, bodyChildren)
	};
}

/**
 * Extract plain text from an AST subtree (for cite preservation).
 */
function extractPlainText(node) {
	if(!node) return "";
	if(node.type === "text") return node.text || "";
	var result = "";
	if(node.children) {
		for(var i = 0; i < node.children.length; i++) {
			result += extractPlainText(node.children[i]);
		}
	}
	return result;
}

function buildHorizRule(context, node) {
	return {
		type: "horizontal_rule"
	};
}

function buildBr(context, node) {
	return {
		type: "hard_break"
	};
}

/**
 * Build link mark for internal wiki links (`[[text|target]]`)
 * The link AST node has type "link", rule "prettylink", attributes.to, and children
 */
function buildLink(context, node) {
	var target = (node.attributes && node.attributes.to) ? node.attributes.to.value : "";
	var content = convertNodes(context, node.children);
	// Apply link mark to all text children
	return content.map(function(childNode) {
		if(childNode.type === "text") {
			var marks = (childNode.marks || []).slice();
			marks.push({ type: "link", attrs: { href: target, title: null } });
			var result = {};
			for(var key in childNode) {
				if(childNode.hasOwnProperty(key)) {
					result[key] = childNode[key];
				}
			}
			result.marks = marks;
			return result;
		}
		return childNode;
	});
}

/**
 * Build link mark for external links (`<a href="...">` elements)
 * These come from prettylink (external), prettyextlink, or extlink rules
 */
function buildAnchor(context, node) {
	var href = (node.attributes && node.attributes.href) ? node.attributes.href.value : "";
	var content = convertNodes(context, node.children);
	return content.map(function(childNode) {
		if(childNode.type === "text") {
			var marks = (childNode.marks || []).slice();
			marks.push({ type: "link", attrs: { href: href, title: null } });
			var result = {};
			for(var key in childNode) {
				if(childNode.hasOwnProperty(key)) {
					result[key] = childNode[key];
				}
			}
			result.marks = marks;
			return result;
		}
		return childNode;
	});
}

function buildCite(context, node) {
	// cite elements inside blockquote are handled by buildBlockquote (stored in attrs.cite);
	// if encountered standalone, convert children as inline content
	return convertNodes(context, node.children);
}

/**
 * Build a PM table from a wiki AST table element.
 * Wiki AST structure: element.tag="table" > children=[tr elements]
 */
function buildTable(context, node) {
	if(!node.children || node.children.length === 0) {
		return buildOpaqueFromNode(context, node);
	}
	var rows = [];
	for(var i = 0; i < node.children.length; i++) {
		var child = node.children[i];
		if(child.type === "element" && child.tag === "tr") {
			var row = buildTableRow(context, child);
			if(row) rows.push(row);
		} else if(child.type === "element" && (child.tag === "tbody" || child.tag === "thead" || child.tag === "tfoot")) {
			// Intermediate row container — extract tr children
			if(child.children) {
				for(var j = 0; j < child.children.length; j++) {
					var grandchild = child.children[j];
					if(grandchild.type === "element" && grandchild.tag === "tr") {
						var row2 = buildTableRow(context, grandchild);
						if(row2) rows.push(row2);
					}
				}
			}
		}
	}
	if(rows.length === 0) {
		return buildOpaqueFromNode(context, node);
	}
	return {
		type: "table",
		content: rows
	};
}

function buildTableRow(context, node) {
	if(!node.children || node.children.length === 0) return null;
	var cells = [];
	for(var i = 0; i < node.children.length; i++) {
		var child = node.children[i];
		if(child.type === "element" && (child.tag === "td" || child.tag === "th")) {
			cells.push(buildTableCell(context, child, child.tag === "th"));
		}
	}
	if(cells.length === 0) return null;
	return {
		type: "table_row",
		content: cells
	};
}

function buildTableCell(context, child, isHeader) {
	var cellContent = convertNodes(context, child.children);
	// Table cells need block content; wrap inline in a paragraph
	if(!cellContent || cellContent.length === 0) {
		cellContent = [{ type: "paragraph" }];
	} else {
		var needsWrap = cellContent.every(function(n) {
			return n.type === "text" || (n.marks && n.marks.length > 0);
		});
		if(needsWrap) {
			cellContent = [{ type: "paragraph", content: cellContent }];
		}
	}
	var attrs = {};
	if(child.attributes) {
		if(child.attributes.colspan) {
			attrs.colspan = parseInt(child.attributes.colspan.value) || 1;
		}
		if(child.attributes.rowspan) {
			attrs.rowspan = parseInt(child.attributes.rowspan.value) || 1;
		}
	}
	return {
		type: isHeader ? "table_header" : "table_cell",
		attrs: attrs,
		content: cellContent
	};
}

/**
 * Build a definition list (<dl>) from wiki AST.
 * Wiki AST structure: element.tag="dl" > children=[dt/dd elements]
 */
function buildDefinitionList(context, node) {
	var items = [];
	var children = node.children || [];
	for(var i = 0; i < children.length; i++) {
		var child = children[i];
		if(child.type === "element" && child.tag === "dt") {
			items.push(buildDefinitionTerm(context, child));
		} else if(child.type === "element" && child.tag === "dd") {
			items.push(buildDefinitionDescription(context, child));
		}
		// Nested <dl> inside <dt>/<dd> is handled by the children themselves
	}
	if(items.length === 0) {
		return buildOpaqueFromNode(context, node);
	}
	return {
		type: "definition_list",
		content: items
	};
}

function buildDefinitionTerm(context, node) {
	return {
		type: "definition_term",
		content: convertNodes(context, node.children)
	};
}

function buildDefinitionDescription(context, node) {
	return {
		type: "definition_description",
		content: convertNodes(context, node.children)
	};
}

/**
 * Many node shares same type `element` in wikiAst, we need to distinguish them by tag.
 */
const elementBuilders = {
	p: buildParagraph,
	h1: (context, node) => buildHeading(context, node, 1),
	h2: (context, node) => buildHeading(context, node, 2),
	h3: (context, node) => buildHeading(context, node, 3),
	h4: (context, node) => buildHeading(context, node, 4),
	h5: (context, node) => buildHeading(context, node, 5),
	h6: (context, node) => buildHeading(context, node, 6),
	ul: buildUnorderedList,
	ol: buildOrderedList,
	li: buildListItem,
	strong: buildStrong,
	b: buildStrong,
	em: buildEm,
	i: buildEm,
	code: buildCode,
	u: buildUnderline,
	strike: buildStrike,
	s: buildStrike,
	del: buildStrike,
	sup: buildSup,
	sub: buildSub,
	pre: buildCodeBlock,
	blockquote: buildBlockquote,
	hr: buildHorizRule,
	br: buildBr,
	a: buildAnchor,
	cite: buildCite,
	table: buildTable,
	tbody: function(context, node) { return buildTable(context, { children: node.children }); },
	thead: function(context, node) { return buildTable(context, { children: node.children }); },
	tfoot: function(context, node) { return buildTable(context, { children: node.children }); },
	tr: buildTableRow,
	td: function(context, node) { return buildTableCell(context, node, false); },
	th: function(context, node) { return buildTableCell(context, node, true); },
	dl: buildDefinitionList,
	dt: buildDefinitionTerm,
	dd: buildDefinitionDescription
};

function element(context, node) {
	const builder = elementBuilders[node.tag];
	if(builder) {
		return builder(context, node);
	} else {
		// Unknown element tag — preserve as opaque_block to avoid data loss
		return buildOpaqueFromNode(context, node);
	}
}

function text(context, node) {
	return {
		type: "text",
		text: node.text
	};
}

function codeblock(context, node) {
	// Extract code and language from attributes
	const code = node.attributes && node.attributes.code ? node.attributes.code.value : "";
	const language = node.attributes && node.attributes.language ? node.attributes.language.value : "";
	
	return {
		type: "code_block",
		attrs: language ? { language: language } : {},
		content: [{
			type: "text",
			text: code
		}]
	};
}

function image(context, node) {
	const getImageAttrsFromWikiAstImageNode = require("$:/plugins/tiddlywiki/prosemirror/image/utils.js").getImageAttrsFromWikiAstImageNode;
	return {
		type: "image",
		attrs: getImageAttrsFromWikiAstImageNode(node)
	};
}

/**
 * Handle transclude nodes (widgets, macros, procedures)
 * For macro calls (<<name>>), convert to paragraph with widget syntax.
 * For other transclusion types ({{tiddler}}, <$transclude>), preserve as opaque_block.
 */
function transclude(context, node) {
	// Check if this is a macrocall (has $variable attribute with macrocallblock rule)
	var hasVariable = node.attributes && node.attributes.$variable;
	var isMacroCall = hasVariable && (node.rule === "macrocallblock" || node.rule === "macrocall" || node.rule === "macrodef");
	
	if(!isMacroCall) {
		// For non-macro transclusions ({{tiddler}}, <$transclude>), preserve as opaque
		return buildOpaqueFromNode(context, node);
	}
	
	// Reconstruct the widget call syntax from the transclude node
	let widgetText = "<<";
	
	// Get the widget/macro/procedure name
	const widgetName = hasVariable ? node.attributes.$variable.value : "unknown";
	
	widgetText += widgetName;
	
	// Add ordered attributes (excluding $variable)
	if(node.orderedAttributes) {
		for(let i = 0; i < node.orderedAttributes.length; i++) {
			const attr = node.orderedAttributes[i];
			if(attr.name !== "$variable") {
				widgetText += " ";
				var safeValue = attr.value || "";
				// Use triple-quotes if value contains double-quotes or >>
				var needsTriple = safeValue.indexOf('"') >= 0 || safeValue.indexOf(">>" ) >= 0;
				var q = needsTriple ? '"""' : '"';
				// For positional parameters, just add the value
				if(attr.name.match(/^\d+$/)) {
					widgetText += q + safeValue + q;
				} else {
					// For named parameters, add name:value (colon syntax for TW5)
					widgetText += attr.name + ":" + q + safeValue + q;
				}
			}
		}
	}
	
	widgetText += ">>";
	
	// Return as a paragraph with the widget text
	return {
		type: "paragraph",
		content: [{
			type: "text",
			text: widgetText
		}]
	};
}

/**
 * Handle wiki link nodes (type "link", rule "prettylink")
 * These are internal wiki links like [[text|target]]
 */
function link(context, node) {
	return buildLink(context, node);
}

/**
 * Helper: serialize a wiki AST node back to raw wikitext for preservation.
 */
function serializeNodeToRawText(node) {
	try {
		var tree = Array.isArray(node) ? node : [node];
		return $tw.utils.serializeWikitextParseTree(tree);
	} catch(e) {
		return JSON.stringify(node);
	}
}

/**
 * Build an opaque_block from an unsupported wiki AST node.
 * Preserves raw text so the content is not lost on round-trip.
 */
function buildOpaqueFromNode(context, node) {
	var rawText = serializeNodeToRawText(node);
	var firstLine = rawText.split("\n")[0] || rawText;
	return {
		type: "opaque_block",
		attrs: {
			rawText: rawText,
			firstLine: firstLine
		}
	};
}

/**
 * Handle pragma nodes (set, importvariables, void with rule "rules", etc.)
 * These are \define, \procedure, \function, \widget, \import, \rules
 * They get preserved as pragma_block atoms in ProseMirror.
 */
function pragmaNode(context, node) {
	// Serialize just this pragma node (without its children, which are the rest of the document)
	var pragmaCopy = {};
	for(var key in node) {
		if(node.hasOwnProperty(key) && key !== "children") {
			pragmaCopy[key] = node[key];
		}
	}
	pragmaCopy.children = [];
	var rawText = serializeNodeToRawText(pragmaCopy);
	var firstLine = rawText.split("\n")[0] || rawText;
	
	// Also convert children (the rest of the document after the pragma)
	var childResults = convertNodes(context, node.children || []);
	var pragmaResult = {
		type: "pragma_block",
		attrs: {
			rawText: rawText,
			firstLine: firstLine.trim()
		}
	};
	return [pragmaResult].concat(childResults);
}

/**
 * Handle entity nodes (e.g. &ndash;, &mdash;, &amp; etc.)
 * Convert them to plain text with the decoded character.
 */
function entity(context, node) {
	// Decode HTML entity to the actual character without using innerHTML
	var entityStr = node.entity || "";
	var entityMap = {
		"&ndash;": "\u2013",
		"&mdash;": "\u2014",
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": "\"",
		"&apos;": "'",
		"&nbsp;": "\u00A0",
		"&laquo;": "\u00AB",
		"&raquo;": "\u00BB",
		"&hellip;": "\u2026",
		"&copy;": "\u00A9",
		"&reg;": "\u00AE",
		"&trade;": "\u2122",
		"&times;": "\u00D7",
		"&divide;": "\u00F7"
	};
	var decoded = entityMap[entityStr];
	if(decoded === undefined) {
		// Try numeric entity: &#123; or &#x1F4A9;
		var numMatch = entityStr.match(/^&#(x?)([0-9a-fA-F]+);$/);
		if(numMatch) {
			var codePoint = parseInt(numMatch[2], numMatch[1] ? 16 : 10);
			if(codePoint > 0 && codePoint <= 0x10FFFF) {
				decoded = String.fromCodePoint(codePoint);
			}
		}
	}
	return {
		type: "text",
		text: decoded !== undefined ? decoded : entityStr
	};
}

/**
 * Key is wikiAst node type, value is node converter function.
 */
const builders = {
	element: element,
	text: text,
	codeblock: codeblock,
	image: image,
	transclude: transclude,
	link: link,
	entity: entity,
	set: pragmaNode,
	importvariables: pragmaNode,
	"void": pragmaNode
};

function wikiAstToProsemirrorAst(node, options) {
	// Initialize context with level tracking
	const context = {};
	for(const key in builders) {
		if(builders.hasOwnProperty(key)) {
			context[key] = builders[key];
		}
	}
	if(options) {
		for(const key in options) {
			if(options.hasOwnProperty(key)) {
				context[key] = options[key];
			}
		}
	}
	context.level = 0;
	const result = convertNodes(context, Array.isArray(node) ? node : [node]);
	// ProseMirror's basic schema requires doc.content to be block+.
	// Ensure we always return at least one empty paragraph for empty source.
	if(!result || result.length === 0) {
		return {
			type: "doc",
			content: [{ type: "paragraph" }]
		};
	}
	
	// Always wrap in a doc
	return {
		type: "doc",
		content: result
	};
}

exports.to = wikiAstToProsemirrorAst;

function convertNodes(context, nodes) {
	if(nodes === undefined || nodes.length === 0) {
		return [];
	}

	return nodes.reduce((accumulator, node) => {
		const convertedNodes = convertANode(context, node);
		return accumulator.concat(convertedNodes);
	}, []);
}

function convertANode(context, node) {
	const builder = context[node.type];
	if(typeof builder === "function") {
		const convertedNode = builder(context, node);
		const arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes;
	}
	// Unknown node type — preserve as opaque_block to avoid data loss
	var rawText = serializeNodeToRawText(node);
	var firstLine = rawText.split("\n")[0] || rawText;
	return [{
		type: "opaque_block",
		attrs: {
			rawText: rawText,
			firstLine: firstLine
		}
	}];
}
