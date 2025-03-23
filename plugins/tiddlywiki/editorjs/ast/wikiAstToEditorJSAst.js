/*\
title: $:/plugins/tiddlywiki/editorjs/ast/wikiAstToEditorJSAst.js
type: application/javascript
module-type: library

Get the EditorJS AST from a Wiki AST

\*/
function wikiAstToEditorJSAst(node, options) {
  return convertNodes({ ...initialContext, ...options }, Array.isArray(node) ? node : [node]);
}

exports.wikiAstToEditorJSAst = wikiAstToEditorJSAst;

const initialContext = {
  builders,
  marks: {},
};

function convertNodes(context, nodes) {
  if (nodes === undefined || nodes.length === 0) {
    return [{ text: '' }];
  }

  return nodes.reduce((accumulator, node) => {
    return [...accumulator, ...editorJSNode(context, node)];
  }, []);
}

function editorJSNode(context, node) {
  const id = context.idCreator?.();
  const withId = (nodeToAddId) => (id === undefined ? nodeToAddId : { ...nodeToAddId, id });
  if ('rule' in node && node.rule !== undefined && node.rule in context.builders) {
    const builder = context.builders[node.rule];
    if (typeof builder === 'function') {
      // basic elements
      const builtEditorJSNodeOrNodes = builder(context, node);
      return Array.isArray(builtEditorJSNodeOrNodes)
        ? builtEditorJSNodeOrNodes.map((child) => withId(child))
        : ([withId(builtEditorJSNodeOrNodes)]);
    }
  } else if ('text' in node) {
    // text node
    return [withId({ text: node.text })];
  } else {
    console.warn(`WikiAst get Unknown node type: ${JSON.stringify(node)}`);
    return [];
  }
  return [];
}

const builders = {
  element,
  text,
};

/** Slate node is compact, we need to filter out some keys from wikiast */
const textLevelKeysToOmit = ['type', 'start', 'end'];

function text(context, text) {
  return {
    text: '', // provides default text
    ...omit(text, textLevelKeysToOmit),
    ...context.marks,
  };
}

const elementBuilders = { ul, ol: ul, li, ...marks };

function element(context, node) {
  const { tag, children } = node;
  if (typeof elementBuilders[tag] === 'function') {
    return elementBuilders[tag](context, node);
  }
  const result = {
    type: tag,
    children: convertNodes(context, children),
  };
  if (node.rule) {
    result.rule = node.rule;
  }
  return result;
}
