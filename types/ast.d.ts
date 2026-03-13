/**
 * Public AST type exports for TiddlyWiki's wiki-text parser.
 *
 * These types are re-exported from generated declaration files.
 * Run `tsc` in the project root to generate `types/core/` first.
 *
 * @example
 * ```ts
 * import type { WikiASTNode, ParseTreeCodeblockNode } from 'tiddlywiki/types/ast';
 *
 * function processNode(node: WikiASTNode) {
 *   if (node.type === 'codeblock') {
 *     const cb: ParseTreeCodeblockNode = node;
 *     console.log(cb.attributes.code.value);
 *   }
 * }
 * ```
 */

export type { ParseTreeAttribute, ParseTreeNode } from './core/modules/parsers/base';
export type { ParseTreeCodeblockNode } from './core/modules/parsers/wikiparser/rules/codeblock';
export type { ParseTreeHtmlNode } from './core/modules/parsers/wikiparser/rules/html';
export type { ParseTreeHeadingNode } from './core/modules/parsers/wikiparser/rules/heading';
export type { ParseTreeListNode, ParseTreeListItemNode } from './core/modules/parsers/wikiparser/rules/list';
export type { ParseTreeQuoteBlockNode } from './core/modules/parsers/wikiparser/rules/quoteblock';
export type { WikiRuleBase } from './core/modules/parsers/wikiparser/wikirulebase';

/** All AST node types that can be produced by the wiki-text parser. */
export type WikiASTNode =
  | import('./core/modules/parsers/wikiparser/rules/codeblock').ParseTreeCodeblockNode
  | import('./core/modules/parsers/wikiparser/rules/html').ParseTreeHtmlNode
  | import('./core/modules/parsers/wikiparser/rules/heading').ParseTreeHeadingNode
  | import('./core/modules/parsers/wikiparser/rules/list').ParseTreeListNode
  | import('./core/modules/parsers/wikiparser/rules/list').ParseTreeListItemNode
  | import('./core/modules/parsers/wikiparser/rules/quoteblock').ParseTreeQuoteBlockNode;
