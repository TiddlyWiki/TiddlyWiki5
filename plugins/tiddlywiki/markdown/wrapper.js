/*\
title: $:/plugins/tiddlywiki/markdown/wrapper.js
type: application/javascript
module-type: parser

Wraps up the markdown-it parser for use as a Parser in TiddlyWiki

\*/
(function(realRequire){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var require = function(m) {
	return realRequire("$:/plugins/tiddlywiki/markdown/" + m + ".js");
};

/// Helper functions ///

function parseAsBoolean(tiddlerName) {
	return $tw.wiki.getTiddlerText(tiddlerName).trim().toLowerCase() === "true";
}

/// Set up configuration options ///

var pluginOpts = {
	renderWikiText: parseAsBoolean("$:/config/markdown/renderWikiText"),
	renderWikiTextPragma: $tw.wiki.getTiddlerText("$:/config/markdown/renderWikiTextPragma").trim()
};

var markdownOpts = {
	html: true,
	xhtmlOut: true,
	breaks: parseAsBoolean("$:/config/markdown/breaks"),
	quotes: $tw.wiki.getTiddlerText("$:/config/markdown/quotes").trim(),
	typographer: parseAsBoolean("$:/config/markdown/typographer"),
	linkify: false
};

var MarkdownIt = require("markdown-it");
var md = new MarkdownIt(markdownOpts);

md = md.use(require("markdown-it-sub"))
	   .use(require("markdown-it-sup"))
	   .use(require("markdown-it-ins"))
	   .use(require("markdown-it-mark"))
	   .use(require("markdown-it-footnote"))
	   .use(require("markdown-it-deflist"))
	   .use(require("markdown-it-tiddlywiki"),pluginOpts);

if($tw.modules.titles["$:/plugins/tiddlywiki/katex/katex.min.js"]) {
	md = md.use(require("markdown-it-katex"));
}

// Overwrite default: render attribute strings in e"..." format instead,
// so HTML entities can be decoded. See parseStringLiteralExt() below.
md.renderer.renderAttrs = function renderAttrs(token) {
	var i, l, result;

	if(!token.attrs) { return ''; }

	result = '';

	for(i=0, l=token.attrs.length; i<l; i++) {
		result += ' ' + md.utils.escapeHtml(token.attrs[i][0]) + '=e"' + md.utils.escapeHtml(token.attrs[i][1]) + '"';
	}

	return result;
};

function deactivateLinks(tree) {
	$tw.utils.each(tree,function(node) {
		if(node.type === "link") {
			node.type = "text";
			node.text = node.children[0].text;
			delete node.attributes;
			delete node.children;
			delete node.attributes;
		} else {
			deactivateLinks(node.children);
		}
	});
}

// true if <code> span came from backtick expr
function isCodifiedCode(node) {
	return node.type === "element"
		&& node.tag === "code"
		&& node.attributes && node.attributes.class && node.attributes.class.value.split(' ').includes("codified");
}

// When a backticked code span is fed into TW, TW can interpret any
// CamcelCase text as wikilinks. Need to remove any links within the code span.
function unWikiLinkCode(tree) {
	$tw.utils.each(tree,function(node) {
		if(isCodifiedCode(node)) {
			deactivateLinks(node.children);
		} else {
			unWikiLinkCode(node.children);
		}
	});
}

function decodeEntities(s) {
	return s.replace(/(&#?[a-zA-Z0-9]{2,8};)/g,$tw.utils.entityDecode);
}

// Add e"..." and e'....' syntax to enable decoding of HTML entities
// in string literals.
function parseStringLiteralExt(source,pos) {
	var node = {
		type: "string",
		start: pos
	};
	var reString = /(?:"""([\s\S]*?)"""|e?"([^"]*)")|(?:e?'([^']*)')/g;
	reString.lastIndex = pos;
	var match = reString.exec(source);
	if(match && match.index === pos) {
		node.value = match[1] !== undefined ? match[1] :
			(match[2] !== undefined ? match[2] : match[3]);
		node.end = pos + match[0].length;
		if(match[0].charAt(0) === "e") {
			node.value = decodeEntities(node.value);
		}
		return node;
	} else {
		return null;
	}
};

function processWikiTree(tree,hasWikiLinkRule) {
	var stack = [].concat(tree);

	var mergeable  = function(node) {
		return node.type === "element" && node.tag === "p" && (!node.attributes || Object.keys(node.attributes).length === 0);
	};

	while(stack.length) {
		var node = stack.pop();
		if(node.type === "element" && node.tag === "p") {
			// reduce nested <p> nodes
			while(node.children && node.children.length === 1 && mergeable(node.children[0])) {
				node.children = node.children[0].children;
			}
		} else if(hasWikiLinkRule && isCodifiedCode(node)) {
			deactivateLinks(node.children);
			continue;
		}
		if(node.children && node.children.length > 0) {
			stack.push.apply(stack,node.children);
		}
	}
}

var MarkdownParser = function(type,text,options) {
	var pragma = pluginOpts.renderWikiText ? pluginOpts.renderWikiTextPragma : "\\rules only html entity commentinline commentblock";
	var env = {}
	var mdTree = md.parse(text,env);
	var textToParse = pragma + '\n<div class="markdown">\n\n' + md.renderer.render(mdTree,md.options,env) + '</div>';

	//console.log(JSON.stringify(mdTree,null,2));
	//console.log((pluginOpts.renderWikiText ? "RenderWiki ON:" : "RenderWki OFF:") + "\n----------------\n" + textToParse);

	var wikiParser;

	var origParseStringLiteral = $tw.utils.parseStringLiteral;
	$tw.utils.parseStringLiteral = parseStringLiteralExt;

	try {
		wikiParser = $tw.wiki.parseText("text/vnd.tiddlywiki",textToParse,{parseAsInline: false, wiki: options.wiki});
	}
	catch (err) {
		wikiParser = $tw.wiki.parseText("text/vnd.tiddlywiki",
			"<strong>Error encountered while parsing the tiddler:</strong><p>" + err.message + "</p>",
			{parseAsInline: false, wiki: options.wiki});
	}
	finally {
		$tw.utils.parseStringLiteral = origParseStringLiteral;
	}
	if(wikiParser.tree.length > 0) {
		var hasWikiLinkRule = false;
		// see if wikilink rule has been invoked
		$tw.utils.each(wikiParser.inlineRules,function(ruleInfo) {
			if(ruleInfo.rule.name === "wikilink") {
				hasWikiLinkRule = true;
				return false;
			}
		});
		processWikiTree(wikiParser.tree,hasWikiLinkRule);
	}
	this.tree = wikiParser.tree;
	this.source = text;
	this.type = type || "text/markdown";
	this.wiki = options.wiki;
};

// to extend MarkdownIt outside of this module, do:
//
// md = $tw.Wiki.parsers["text/markdown"].prototype.md;
// md.use(plugin[, options]);
MarkdownParser.prototype.md = md;

exports["text/markdown"] = MarkdownParser;
exports["text/x-markdown"] = MarkdownParser;
})(require);
