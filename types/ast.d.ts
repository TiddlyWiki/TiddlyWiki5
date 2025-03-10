import { ParseTreeCodeblockNode } from '$:/core/modules/parsers/wikiparser/rules/codeblock.js';
export { ParseTreeCodeblockNode } from '$:/core/modules/parsers/wikiparser/rules/codeblock.js';
import { ParseTreeHtmlNode } from '$:/core/modules/parsers/wikiparser/rules/html.js';
export { ParseTreeHtmlNode } from '$:/core/modules/parsers/wikiparser/rules/html.js';

export type WikiASTNode = ParseTreeCodeblockNode | ParseTreeHtmlNode;
