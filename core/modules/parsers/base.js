/**
 * Base type definitions for TiddlyWiki's parser infrastructure.
 *
 * This file is intentionally NOT marked as a TiddlyWiki module (it has no
 * tiddler-style file header), so it is never loaded into the wiki runtime.
 * It exists solely for TypeScript type inference via JSDoc annotations.
 *
 * Run `tsc --emitDeclarationOnly` from the project root to generate `.d.ts`
 * files in `types/core/`.
 */

"use strict";

/**
 * Represents a macro call parse tree node (used inside attribute values).
 *
 * @typedef {Object} IMacroCallParseTreeNode
 * @property {"macro"} type - Always "macro"
 * @property {string} name - Name of the macro being called
 * @property {Array<{name: string, value: string}>} params - Macro parameters
 * @property {number} start - Start position in source text
 * @property {number} end - End position in source text
 */

/**
 * Represents an attribute in a parse tree node.
 *
 * @typedef {Object} ParseTreeAttribute
 * @property {'string' | 'number' | 'bigint' | 'boolean' | 'macro' | 'macro-parameter' | 'indirect'} type - Kind of attribute value
 * @property {string | IMacroCallParseTreeNode} [value] - The attribute value
 * @property {string} [name] - Attribute name
 * @property {number} [start] - Start position in source text
 * @property {number} [end] - End position in source text
 * @property {string} [textReference] - For indirect attributes, the text reference
 */

/**
 * Base structure shared by all parse tree nodes.
 *
 * @typedef {Object} ParseTreeNode
 * @property {string} type - Widget type that will render this node (e.g. "element", "text", "codeblock")
 * @property {string} [rule] - Parse rule that generated this node
 * @property {number} [start] - Start position in source text
 * @property {number} [end] - End position in source text
 * @property {Record<string, ParseTreeAttribute>} [attributes] - Attributes of the widget
 * @property {ParseTreeNode[]} [children] - Child parse nodes
 */

/**
 * Base class type for TiddlyWiki parsers.
 *
 * Provides the common shape shared by WikiParser and other parsers.
 * This constructor is used for JSDoc `@extends` references only.
 *
 * @class
 * @param {string} type - Content MIME type of the text to be parsed
 * @param {string} text - Source text to be parsed
 * @param {Object} options - Parser options
 * @param {boolean} [options.parseAsInline=false] - If true, parse as inline run
 * @param {Object} options.wiki - Reference to the wiki store in use
 * @param {string} [options._canonical_uri] - Optional URI of content if text is missing or empty
 * @param {boolean} [options.configTrimWhiteSpace=false] - If true, trim whitespace
 */
function Parser(type, text, options) {
	/**
   * Result parse tree.
   * @type {ParseTreeNode[]}
   */
	this.tree = [];

	/**
   * Original source text (unmodified).
   * @type {string}
   */
	this.source = text;

	/**
   * Source MIME type.
   * @type {string}
   */
	this.type = type;
}

exports.Parser = Parser;
