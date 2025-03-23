/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/wikiAstFromProsemirrorAst.js
type: application/javascript
module-type: library

Get the Prosemirror AST from a Wiki AST

\*/


/**
 * Key is `node.type`, value is node converter function.
 */
const builders = {
  // auto parse basic element nodes
  // eslint-disable-next-line unicorn/prefer-object-from-entries
  ...(htmlTags).reduce(
    (previousValue, currentValue) => {
      previousValue[currentValue] = element;
      return previousValue;
    },
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter, @typescript-eslint/consistent-type-assertions
    {},
  ),
  [ELEMENT_CODE_BLOCK]: codeblock,
  [ELEMENT_LIC]: lic,
  text,
  widget,
  macro: widget,
  set,
};

function wikiAstFromProsemirrorAst(input) {
  return convertNodes(builders, Array.isArray(input) ? input : [input]);
}

exports.wikiAstFromProsemirrorAst = wikiAstFromProsemirrorAst;

function convertNodes(builders, nodes) {
  if (nodes === undefined || nodes.length === 0) {
    return [];
  }

  return nodes.reduce((accumulator, node) => {
    return [...accumulator, ...convertWikiAstNode(builders, node)];
  }, []);
}

function convertWikiAstNode(builders, node) {
  // only text and root node don't have a `type` field, deal with it first
  if (isText(node)) {
    return [builders.text(builders, node)];
  }
  if (isElement(node)) {
    const builder = builders[node.type];
    if (typeof builder === 'function') {
      const builtSlateNodeOrNodes = builder(builders, node);
      return Array.isArray(builtSlateNodeOrNodes)
        ? builtSlateNodeOrNodes.map((child) => ({ ...getSlatePlateASTAdditionalProperties(node), ...child }))
        : ([{ ...getSlatePlateASTAdditionalProperties(node), ...builtSlateNodeOrNodes }]);
    }
  }
  // it might be a root or pure parent node, reduce it
  if ('children' in node) {
    return convertNodes(builders, node.children);
  }
  return [];
}
