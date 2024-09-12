/*\
title: $:/core/modules/parsers/base.js
type: application/javascript
module-type: library
\*/

/**
 * Represents an attribute in a parse tree node
 * 
 * @typedef {Object} ParseTreeAttribute
 * @property {number} [end] - End position of attribute in source text
 * @property {string} [name] - Name of attribute
 * @property {number} [start] - Start position of attribute in source text
 * @property {'string' | 'number' | 'bigint' | 'boolean' | 'macro' | 'macro-parameter'} type - Type of attribute
 * @property {string | IMacroCallParseTreeNode} value - Actual value of attribute
 */

/**
 * Base structure for a parse node
 * 
 * @typedef {Object} ParseTreeNode
 * @property {string} type - Type of widget that will render this node
 * @property {string} rule - Parse rule that generated this node. One rule can generate multiple types of nodes
 * @property {number} start - Rule start marker in source text
 * @property {number} end - Rule end marker in source text
 * @property {Record<string,ParseTreeAttribute>} [attributes] - Attributes of widget
 * @property {ParseTreeNode[]} [children] - Array of child parse nodes
 */

/**
 * Base class for parsers. This only provides typing
 * 
 * @class
 * @param {string} type - Content type of text to be parsed
 * @param {string} text - Text to be parsed
 * @param {Object} options - Parser options
 * @param {boolean} [options.parseAsInline=false] - If true, text will be parsed as an inline run
 * @param {Object} options.wiki - Reference to wiki store in use
 * @param {string} [options._canonical_uri] - Optional URI of content if text is missing or empty
 * @param {boolean} [options.configTrimWhiteSpace=false] - If true, parser trims white space
 */
function Parser(type, text, options) {
  /**
   * Result AST
   * @type {ParseTreeNode[]}
   */
  this.tree = [];

  /**
   * Original text without modifications
   * @type {string}
   */
  this.source = text;

  /**
   * Source content type in MIME format
   * @type {string}
   */
  this.type = type;
}

exports.Parser = Parser;
