/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/markdown-to-wikiast.js
type: application/javascript
module-type: utils

Convert markdown-it tokens to TiddlyWiki parse tree (AST)

\*/

"use strict";

let handlers = {};

function initHandlers() {
  // Only initialize once
	if(Object.keys(handlers).length === 0) {
		$tw.modules.forEachModuleOfType("markdown-to-wikiast-handler", (title, module) => {
			if(module.type) {
				handlers[module.type] = module;
			} else {
				$tw.utils.each(module, (handler, key) => {
					if(handler.type) {
						handlers[handler.type] = handler;
					}
				});
			}
		});
	}
}

function findMatchingClose(tokens, openIndex, openType) {
	const closeType = openType.replace("_open", "_close");
	let depth = 1;
	
	for(let i = openIndex + 1; i < tokens.length; i++) {
		if(tokens[i].type === openType) {
			depth++;
		} else if(tokens[i].type === closeType) {
			depth--;
			if(depth === 0) {
				return i;
			}
		}
	}
	
	return tokens.length;
}

function processInlineTokens(inlineTokens) {
	const result = [];
	
	for(let i = 0; i < inlineTokens.length; i++) {
		const token = inlineTokens[i];
		const handler = handlers[token.type];
		
		if(handler && handler.handler) {
			const context = {
				tokens: inlineTokens,
				index: i,
				skipTo: i,
				processInlineTokens
			};
			
			const node = handler.handler(token, context);
			
			if(!handler.isContainerClose && node) {
				result.push(node);
			}
			
			if(context.skipTo > i) {
				i = context.skipTo - 1;
			}
		} else {
			if(!["strong_close", "em_close", "s_close", "link_close"].includes(token.type) && token.content) {
				result.push({
					type: "text",
					text: token.content
				});
			}
		}
	}
	
	return result;
}

function processBlockTokens(tokens) {
	const result = [];
	
	for(let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		const handler = handlers[token.type];
		
		if(handler && handler.handler) {
			const context = {
				tokens,
				index: i,
				skipTo: i,
				processInlineTokens
			};
			
			const node = handler.handler(token, context);
			
			if(handler.isContainerClose) {
				// Skip container close tokens
			} else if(handler.isContainer) {
				const closeIndex = findMatchingClose(tokens, i, token.type);
				if(closeIndex > i + 1) {
					node.children = processBlockTokens(tokens.slice(i + 1, closeIndex));
				}
				result.push(node);
				i = closeIndex;
			} else if(node) {
				result.push(node);
			}
			
			if(context.skipTo > i) {
				i = context.skipTo - 1;
			}
		} else if(token.type === "inline") {
			const inlineChildren = processInlineTokens(token.children || []);
			result.push(...inlineChildren);
		}
	}
	
	return result;
}

exports.markdownTextToWikiAST = function(markdownText) {
	initHandlers();
	
	let MarkdownIt;
	try {
		MarkdownIt = require("$:/plugins/tiddlywiki/markdown/markdown-it.js");
	} catch(e) {
		throw new Error("Markdown plugin is required for markdown-to-wikitext conversion. Please install the tiddlywiki/markdown plugin.");
	}
	
	const md = new MarkdownIt({
		html: true,
		xhtmlOut: true,
		breaks: false,
		typographer: false,
		linkify: false
	});
	
	const tokens = md.parse(markdownText, {});
	return $tw.utils.mdASTToWikiAST(tokens);
};

exports.mdASTToWikiAST = function(tokens) {
	initHandlers();
	return processBlockTokens(tokens);
};
