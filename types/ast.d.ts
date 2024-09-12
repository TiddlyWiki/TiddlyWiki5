import { ParseTreeCodeblockNode } from './core/modules/parsers/wikiparser/rules/codeblock';
export { ParseTreeCodeblockNode } from './core/modules/parsers/wikiparser/rules/codeblock';
import { ParseTreeHtmlNode } from './core/modules/parsers/wikiparser/rules/html';
export { ParseTreeHtmlNode } from './core/modules/parsers/wikiparser/rules/html';

export type WikiASTNode = ParseTreeCodeblockNode | ParseTreeHtmlNode;
