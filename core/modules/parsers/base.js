/**
 * Base structure for a parse node
 * 
 * @typedef {Object} ParseTreeNode
 * @property {string} type - Type of widget
 * @property {Object} [attributes] - Attributes of widget
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
