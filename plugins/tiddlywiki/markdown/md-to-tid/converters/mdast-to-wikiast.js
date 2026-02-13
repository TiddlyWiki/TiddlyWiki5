/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/mdast-to-wikiast.js
type: application/javascript
module-type: utils

Convert markdown-it tokens to TiddlyWiki parse tree (AST)

\*/

"use strict";

const handlers = {};

function initHandlers() {
	// Only initialize once
	if(Object.keys(handlers).length === 0) {
		$tw.modules.forEachModuleOfType("mdast-to-wikiast-rule", (title, module) => {
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
		} else if(handler && handler.isCloseToken) {
			// Skip close tokens - they're handled by their corresponding open token
		} else {
			// Only add text content for tokens without handlers
			if(token.content) {
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
		MarkdownIt = require("$:/plugins/tiddlywiki/markdown/markdown-it.js"); // 路径保持不变，因 markdown-it.js 仍在主 markdown 插件下
	} catch(e) {
		throw new Error("Markdown plugin is required for markdown-to-wikitext conversion. Please install the tiddlywiki/markdown plugin.");
	}
	
	const md = new MarkdownIt();
	const tokens = md.parse(markdownText, {});
	return $tw.utils.mdASTToWikiAST(tokens);
};

exports.mdASTToWikiAST = function(tokens) {
	initHandlers();
	return processBlockTokens(tokens);
};
