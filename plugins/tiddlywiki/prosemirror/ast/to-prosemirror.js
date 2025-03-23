/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js
type: application/javascript
module-type: library

Get the Prosemirror AST from a Wiki AST

\*/

/**
 * Many node shares same type `element` in wikiAst, we need to distinguish them by tag.
 */
const elementBuilders = {
  p: function(context, node) {
    return {
      type: "paragraph",
      content: convertNodes(context, node.children)
    };
  },
  h1: function(context, node) {
    return {
      type: "heading",
      attrs: { level: 1 },
      content: convertNodes(context, node.children)
    };
  },
  h2: function(context, node) {
    return {
      type: "heading",
      attrs: { level: 2 },
      content: convertNodes(context, node.children)
    };
  },
  h3: function(context, node) {
    return {
      type: "heading",
      attrs: { level: 3 },
      content: convertNodes(context, node.children)
    };
  },
  h4: function(context, node) {
    return {
      type: "heading",
      attrs: { level: 4 },
      content: convertNodes(context, node.children)
    };
  },
  h5: function(context, node) {
    return {
      type: "heading",
      attrs: { level: 5 },
      content: convertNodes(context, node.children)
    };
  },
  h6: function(context, node) {
    return {
      type: "heading",
      attrs: { level: 6 },
      content: convertNodes(context, node.children)
    };
  },
  ul: function(context, node) {
    return {
      type: "bullet_list",
      content: convertNodes(context, node.children)
    };
  },
  ol: function(context, node) {
    return {
      type: "ordered_list",
      content: convertNodes(context, node.children)
    };
  },
  li: function(context, node) {
    // In ProseMirror, list items must contain block content (not bare text)
    // TODO: find solution to https://discuss.prosemirror.net/t/removing-the-default-paragraph-p-inside-a-list-item-li/2745/17
    const processedContent = convertNodes(context, node.children);
    const wrappedContent = wrapTextNodesInParagraphs(context, processedContent);
    
    return {
      type: "list_item",
      content: wrappedContent
    };
  }
};

/**
 * Helper function to ensure text nodes in list items are wrapped in paragraphs
 * ProseMirror requires list items to contain block content, not bare text
 */
function wrapTextNodesInParagraphs(context, nodes) {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  const result = [];
  let currentTextNodes = [];

  function flushTextNodes() {
    if (currentTextNodes.length > 0) {
      result.push({
        type: "paragraph",
        content: currentTextNodes
      });
      currentTextNodes = [];
    }
  }

  nodes.forEach(node => {
    // If it's a text node, collect it
    if (node.type === "text") {
      currentTextNodes.push(node);
    } else {
      // If we encounter a non-text node, flush any collected text nodes
      flushTextNodes();
      // Add the non-text node as is
      result.push(node);
    }
  });

  // Flush any remaining text nodes
  flushTextNodes();

  return result;
}

function element(context, node) {
  const builder = elementBuilders[node.tag];
  if (builder) {
    return builder(context, node);
  } else {
    console.warn(`Unknown element tag: ${node.tag}`);
    return [];
  }
}

function text(context, node) {
  return {
    type: "text",
    text: node.text
  };
}

/**
 * Key is wikiAst node type, value is node converter function.
 */
const builders = {
  element,
  text
};

function wikiAstToProsemirrorAst(node, options) {
  const context = { ...builders, ...options };
  const result = convertNodes(context, Array.isArray(node) ? node : [node]);
  
  // Wrap in a doc if needed
  if (result.length > 0 && result[0].type !== "doc") {
    return {
      type: "doc",
      content: result
    };
  }
  
  return result;
}

exports.to = wikiAstToProsemirrorAst;

function convertNodes(context, nodes) {
  if (nodes === undefined || nodes.length === 0) {
    return [];
  }

  return nodes.reduce((accumulator, node) => {
    return [...accumulator, ...convertANode(context, node)];
  }, []);
}

function convertANode(context, node) {
  var builder = context[node.type];
  if (typeof builder === 'function') {
    var convertedNode = builder(context, node);
    var arrayOfNodes = (Array.isArray(convertedNode)
    ? convertedNode : [convertedNode]);
    return arrayOfNodes;
  }
  console.warn(`ProseMirror get Unknown node type: ${JSON.stringify(node)}`);
  return [];
}
