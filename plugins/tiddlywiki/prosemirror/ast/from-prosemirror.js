/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js
type: application/javascript
module-type: library

Get the Wiki AST from a Prosemirror AST

\*/

function doc(context, node) {
  return convertNodes(context, node.content);
}

function paragraph(context, node) {
  return {
    type: "element",
    tag: "p",
    rule: "parseblock",
    children: convertNodes(context, node.content)
  };
}

function text(context, node) {
  return {
    type: "text",
    text: node.text
  }
}

function heading(context, node) {
  return {
    type: "element",
    tag: "h" + node.attrs.level,
    rule: "heading",
    attributes: {
      // TODO: restore class if any
    },
    children: convertNodes(context, node.content)
  };
}

function bullet_list(context, node) {
  return {
    type: "element",
    tag: "ul",
    rule: "list",
    children: convertNodes(context, node.content)
  };
}

function ordered_list(context, node) {
  return {
    type: "element",
    tag: "ol",
    rule: "list",
    children: convertNodes(context, node.content)
  };
}

function list_item(context, node) {
  return {
    type: "element",
    tag: "li",
    rule: "list",
    children: convertNodes(context, node.content)
  };
}

/**
 * Key is `node.type`, value is node converter function.
 */
const builders = {
  doc,
  paragraph,
  text,
  heading,
  bullet_list,
  ordered_list,
  list_item,
};

function wikiAstFromProseMirrorAst(input) {
  return convertNodes(builders, Array.isArray(input) ? input : [input]);
}

exports.from = wikiAstFromProseMirrorAst;

function convertNodes(builders, nodes) {
  if (nodes === undefined || nodes.length === 0) {
    return [];
  }

  return nodes.reduce((accumulator, node) => {
    return [...accumulator, ...convertANode(builders, node)];
  }, []);
}

function restoreMetadata(node) {
  // TODO: restore attributes, orderedAttributes, isBlock
  return {};
}
function convertANode(builders, node) {
  var builder = builders[node.type];
  if (typeof builder === 'function') {
    var convertedNode = builder(builders, node);
    var arrayOfNodes = (Array.isArray(convertedNode)
    ? convertedNode : [convertedNode]);
    return arrayOfNodes.map((child) => ({ ...restoreMetadata(node), ...child }));
  }
  console.warn(`WikiAst get Unknown node type: ${JSON.stringify(node)}`);
  return [];
}
