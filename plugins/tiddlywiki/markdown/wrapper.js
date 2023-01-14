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

var MarkdownIt = require("markdown-it");

function parseAsBoolean(tiddlerName) {
	return $tw.wiki.getTiddlerText(tiddlerName,"false").trim().toLowerCase() === "true";
}

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
	linkify: parseAsBoolean("$:/config/markdown/linkify")
};

// Retrieve needed TW rule classes and instantiated rules
function setupWikiRules(pluginOptions) {
	var results = {};

	function collectAllRules(classes,type) {
		var rulesInfo = [], key,
			self = wikiParser;
		for(key in classes) {
			// instantiate the rule
			var RuleClass = classes[key];
			var rule = new RuleClass(self);
			rule.name = key;
			rule.class = RuleClass;
			rule.is = {};
			rule.is[type] = true;
			rule.init(self);

			rulesInfo.push({
				rule: rule,
				matchIndex: -1
			});
		};
		return rulesInfo;
	}

	// first pass: get all rule classes
	var wikiParser = new $tw.Wiki.parsers["text/vnd.tiddlywiki"](null, '', {parseAsInline: true, wiki: $tw.wiki});

	// restore all possible rules from each rule class
	wikiParser.pragmaRules = collectAllRules(wikiParser.pragmaRuleClasses,'pragma');
	wikiParser.blockRules = collectAllRules(wikiParser.blockRuleClasses,'block');
	wikiParser.inlineRules = collectAllRules(wikiParser.inlineRuleClasses,'inline');

	var pragma = pluginOptions.renderWikiText
			? "\\rules except latex-parser extlink\n" + pluginOptions.renderWikiTextPragma
			: "\\rules only html entity commentinline commentblock";

	wikiParser.pos = 0;
	wikiParser.source = pragma;
	wikiParser.sourceLength = pragma.length;

	// second pass: remove uninterested rules based on \rules pragma
	wikiParser.parsePragmas();

	results.blockRules = {};
	results.inlineRules = {}
	results.blockRuleClasses = {};
	results.inlineRuleClasses = {};

	// save the rule sets for future markdown parsing
	wikiParser.blockRules.forEach(function(ruleinfo) {
		results.blockRules[ruleinfo.rule.name] = ruleinfo;
		results.blockRuleClasses[ruleinfo.rule.name] = ruleinfo.rule.class;
	});
	wikiParser.inlineRules.forEach(function(ruleinfo) {
		results.inlineRules[ruleinfo.rule.name] = ruleinfo;
		results.inlineRuleClasses[ruleinfo.rule.name] = ruleinfo.rule.class;
	});
	return results;
}

// Creates markdown-it parser
function createMarkdownEngine(markdownItOptions, pluginOptions) {
	var md = new MarkdownIt(markdownItOptions)
				.use(require("markdown-it-sub"))
				.use(require("markdown-it-sup"))
				.use(require("markdown-it-ins"))
				.use(require("markdown-it-mark"))
				.use(require("markdown-it-footnote"))
				.use(require("markdown-it-deflist"));

	var results = setupWikiRules(pluginOptions);

	MarkdownParser.prototype.blockRuleClasses = results.blockRuleClasses;
	MarkdownParser.prototype.blockRules = results.blockRules;

	MarkdownParser.prototype.inlineRuleClasses = results.inlineRuleClasses;
	MarkdownParser.prototype.inlineRules = results.inlineRules;

	if(pluginOptions.renderWikiText && $tw.modules.titles["$:/plugins/tiddlywiki/katex/katex.min.js"]) {
		md.use(require("markdown-it-katex"));
	}

	md.use(require("markdown-it-tiddlywiki"),{
			renderWikiText: pluginOptions.renderWikiText,
			blockRules: results.blockRules,
			inlineRules: results.inlineRules
		});

	$tw.utils.each(['image','prettylink','prettyextlink'], function(rule) {
		if(MarkdownParser.prototype.inlineRules[rule]) {
			// delegate to md; ignore the rule class in WikiParser
			delete MarkdownParser.prototype.inlineRuleClasses[rule];
		}
	});
	return md;
}

/// Parse tree post processing ///

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

// true if the node contains "_codified_" class attribute
function isCodified(node) {
	return node.attributes
		&& node.attributes.class
		&& node.attributes.class.type === "string"
		&& (node.attributes.class.value.split(" ").indexOf("_codified_") !== -1);
}

function decodeEntities(s) {
	return s.replace(/(&#?[a-zA-Z0-9]{2,8};)/g,$tw.utils.entityDecode);
}

// Add e"..." and e'....' syntax to enable decoding of HTML entities
// in string literals.
function parseStringLiteralExtended(source,pos) {
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
}

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
		} else if(hasWikiLinkRule && isCodified(node)) {
			deactivateLinks(node.children);
			continue;
		}
		if(node.children && node.children.length > 0) {
			stack.push.apply(stack,node.children);
		}
	}
}

// to extend MarkdownIt outside of this module, do:
//
// md = $tw.Wiki.parsers["text/markdown"].prototype.md;
// md.use(plugin[, options]);
MarkdownParser.prototype.md = createMarkdownEngine(markdownOpts,pluginOpts);

function MarkdownParser(type,text,options) {
	var env = {}
	var md = this.md;
	var mdTree = md.parse(text,env);
	var textToParse = '<div class="markdown">\n' + md.renderer.render(mdTree,md.options,env) + '</div>';

	//console.log(JSON.stringify(mdTree,null,2));
	//console.log("\n----------------\n" + textToParse);

	var wikiParser;

	var origParseStringLiteral = $tw.utils.parseStringLiteral;
	$tw.utils.parseStringLiteral = parseStringLiteralExtended;

	try {
		wikiParser = new $tw.Wiki.parsers["text/vnd.tiddlywiki"](null,textToParse,{
			parseAsInline: true,
			wiki: options.wiki,
			rules: { pragma: {}, block: this.blockRuleClasses, inline: this.inlineRuleClasses }
		});
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
}

exports["text/markdown"] = MarkdownParser;
exports["text/x-markdown"] = MarkdownParser;
})(require);
