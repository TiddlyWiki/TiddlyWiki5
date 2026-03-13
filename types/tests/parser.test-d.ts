/**
 * Type-level tests for wiki parser AST types.
 */

import type { ParseTreeCodeblockNode } from '../core/modules/parsers/wikiparser/rules/codeblock';
import type { ParseTreeHtmlNode } from '../core/modules/parsers/wikiparser/rules/html';
import type { ParseTreeHeadingNode } from '../core/modules/parsers/wikiparser/rules/heading';
import type { ParseTreeListNode, ParseTreeListItemNode } from '../core/modules/parsers/wikiparser/rules/list';
import type { ParseTreeQuoteBlockNode } from '../core/modules/parsers/wikiparser/rules/quoteblock';
import type { ParseTreeAttribute } from '../core/modules/parsers/base';
import type { WikiRuleBase } from '../core/modules/parsers/wikiparser/wikirulebase';

type AssertEqual<T, U> = [T] extends [U] ? ([U] extends [T] ? true : never) : never;
declare function assertType<T>(_val: AssertEqual<T, true>): void;

assertType<AssertEqual<ParseTreeCodeblockNode['type'], 'codeblock'>>(true);
assertType<AssertEqual<ParseTreeCodeblockNode['rule'], 'codeblock'>>(true);
assertType<AssertEqual<ParseTreeCodeblockNode['start'], number>>(true);

// @ts-expect-error paragraph is not assignable to codeblock literal type
const _badCodeType: ParseTreeCodeblockNode['type'] = 'paragraph';
// @ts-expect-error html is not assignable to codeblock rule literal
const _badCodeRule: ParseTreeCodeblockNode['rule'] = 'html';
// @ts-expect-error start must be number
const _badCodeStart: ParseTreeCodeblockNode['start'] = '0';

const codeNode: ParseTreeCodeblockNode = {
  type: 'codeblock',
  rule: 'codeblock',
  start: 1,
  end: 2,
  attributes: {
    code: { type: 'string', value: 'x', start: 1, end: 2 },
    language: { type: 'string', value: 'js', start: 1, end: 2 }
  }
};
void codeNode;

assertType<AssertEqual<ParseTreeHtmlNode['type'], 'element'>>(true);
assertType<AssertEqual<ParseTreeHtmlNode['rule'], 'html'>>(true);
// @ts-expect-error codeblock is not assignable to element literal
const _badHtmlType: ParseTreeHtmlNode['type'] = 'codeblock';

const htmlNode: ParseTreeHtmlNode = {
  type: 'element',
  rule: 'html',
  tag: 'div',
  start: 1,
  end: 2,
  attributes: {},
  orderedAttributes: [],
  isSelfClosing: false
};
void htmlNode;

assertType<AssertEqual<ParseTreeHeadingNode['tag'], 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>>(true);
// @ts-expect-error div is not valid heading tag
const _badHeadingTag: ParseTreeHeadingNode['tag'] = 'div';

assertType<AssertEqual<ParseTreeListNode['tag'], 'ul' | 'ol' | 'dl' | 'blockquote'>>(true);
assertType<AssertEqual<ParseTreeListItemNode['tag'], 'li' | 'dt' | 'dd' | 'div'>>(true);
// @ts-expect-error div is not valid list container
const _badListTag: ParseTreeListNode['tag'] = 'div';
// @ts-expect-error ul is not valid list item tag
const _badListItemTag: ParseTreeListItemNode['tag'] = 'ul';

assertType<AssertEqual<ParseTreeQuoteBlockNode['tag'], 'blockquote'>>(true);
// @ts-expect-error div is not valid quote tag
const _badQuoteTag: ParseTreeQuoteBlockNode['tag'] = 'div';

type WikiASTNode =
  | ParseTreeCodeblockNode
  | ParseTreeHtmlNode
  | ParseTreeHeadingNode
  | ParseTreeListNode
  | ParseTreeQuoteBlockNode;

function narrow(node: WikiASTNode) {
  if (node.type === 'codeblock') {
    const v: string = node.attributes.code.value;
    void v;
  }
  if (node.type === 'element' && node.rule === 'heading') {
    const h: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = node.tag;
    void h;
  }
}
void narrow;

const attr: ParseTreeAttribute = { type: 'string', value: 'x' };
void attr;

// @ts-expect-error bad-type is not valid ParseTreeAttribute type
const _badAttrType: ParseTreeAttribute['type'] = 'bad-type';

declare const ruleBase: WikiRuleBase;
const _ruleName: string = ruleBase.name;
void _ruleName;

void _badCodeType;
void _badCodeRule;
void _badCodeStart;
void _badHtmlType;
void _badHeadingTag;
void _badListTag;
void _badListItemTag;
void _badQuoteTag;
void _badAttrType;
