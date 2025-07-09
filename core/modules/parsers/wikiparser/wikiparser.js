/*\
title: $:/core/modules/parsers/wikiparser/wikiparser.js
type: application/javascript
module-type: parser

The wiki text parser processes blocks of source text into a parse tree.

The parse tree is made up of nested arrays of these JavaScript objects:

	{type: "element", tag: <string>, attributes: {}, children: []} - an HTML element
	{type: "text", text: <string>} - a text node
	{type: "entity", value: <string>} - an entity
	{type: "raw", html: <string>} - raw HTML

Attributes are stored as hashmaps of the following objects:

	{type: "string", value: <string>} - literal string
	{type: "indirect", textReference: <textReference>} - indirect through a text reference
	{type: "macro", macro: <TBD>} - indirect through a macro invocation

\*/

"use strict";

/*
type: content type of text
text: text to be parsed
options: see below:
	parseAsInline: true to parse text as inline instead of block
	wiki: reference to wiki to use
	_canonical_uri: optional URI of content if text is missing or empty
	configTrimWhiteSpace: true to trim whitespace
*/
const WikiParser = function(type,text,options) {
	this.wiki = options.wiki;
	const self = this;
	// Check for an externally linked tiddler
	if($tw.browser && (text || "") === "" && options._canonical_uri) {
		this.loadRemoteTiddler(options._canonical_uri);
		text = $tw.language.getRawString("LazyLoadingWarning");
	}
	// Save the parse text
	this.type = type || "text/vnd.tiddlywiki";
	this.source = text || "";
	this.sourceLength = this.source.length;
	// Flag for ignoring whitespace
	this.configTrimWhiteSpace = options.configTrimWhiteSpace !== undefined ? options.configTrimWhiteSpace : false;
	// Parser mode
	this.parseAsInline = options.parseAsInline;
	// Set current parse position
	this.pos = 0;
	// Start with empty output
	this.tree = [];
	// Assemble the rule classes we're going to use
	let pragmaRuleClasses; let blockRuleClasses; let inlineRuleClasses;
	if(options.rules) {
		pragmaRuleClasses = options.rules.pragma;
		blockRuleClasses = options.rules.block;
		inlineRuleClasses = options.rules.inline;
	} else {
		// Setup the rule classes if we don't have them already
		if(!this.pragmaRuleClasses) {
			WikiParser.prototype.pragmaRuleClasses = $tw.modules.createClassesFromModules("wikirule","pragma",$tw.WikiRuleBase);
			this.setupRules(WikiParser.prototype.pragmaRuleClasses,"$:/config/WikiParserRules/Pragmas/");
		}
		pragmaRuleClasses = this.pragmaRuleClasses;
		if(!this.blockRuleClasses) {
			WikiParser.prototype.blockRuleClasses = $tw.modules.createClassesFromModules("wikirule","block",$tw.WikiRuleBase);
			this.setupRules(WikiParser.prototype.blockRuleClasses,"$:/config/WikiParserRules/Block/");
		}
		blockRuleClasses = this.blockRuleClasses;
		if(!this.inlineRuleClasses) {
			WikiParser.prototype.inlineRuleClasses = $tw.modules.createClassesFromModules("wikirule","inline",$tw.WikiRuleBase);
			this.setupRules(WikiParser.prototype.inlineRuleClasses,"$:/config/WikiParserRules/Inline/");
		}
		inlineRuleClasses = this.inlineRuleClasses;
	}
	// Instantiate the pragma parse rules
	this.pragmaRules = this.instantiateRules(pragmaRuleClasses,"pragma",0);
	// Instantiate the parser block and inline rules
	this.blockRules = this.instantiateRules(blockRuleClasses,"block",0);
	this.inlineRules = this.instantiateRules(inlineRuleClasses,"inline",0);
	// Parse any pragmas
	const topBranch = this.parsePragmas();
	// Parse the text into inline runs or blocks
	if(this.parseAsInline) {
		topBranch.push.apply(topBranch,this.parseInlineRun());
	} else {
		topBranch.push.apply(topBranch,this.parseBlocks());
	}
	// Build rules' name map
	this.usingRuleMap = {};
	$tw.utils.each(this.pragmaRules,(ruleInfo) => {self.usingRuleMap[ruleInfo.rule.name] = Object.getPrototypeOf(ruleInfo.rule);});
	$tw.utils.each(this.blockRules,(ruleInfo) => {self.usingRuleMap[ruleInfo.rule.name] = Object.getPrototypeOf(ruleInfo.rule);});
	$tw.utils.each(this.inlineRules,(ruleInfo) => {self.usingRuleMap[ruleInfo.rule.name] = Object.getPrototypeOf(ruleInfo.rule);});
	// Return the parse tree
};

/*
*/
WikiParser.prototype.loadRemoteTiddler = function(url) {
	const self = this;
	$tw.utils.httpRequest({
		url,
		type: "GET",
		callback(err,data) {
			if(!err) {
				const tiddlers = self.wiki.deserializeTiddlers(".tid",data,self.wiki.getCreationFields());
				$tw.utils.each(tiddlers,(tiddler) => {
					tiddler["_canonical_uri"] = url;
				});
				if(tiddlers) {
					self.wiki.addTiddlers(tiddlers);
				}
			}
		}
	});
};

/*
*/
WikiParser.prototype.setupRules = function(proto,configPrefix) {
	const self = this;
	if(!$tw.safeMode) {
		$tw.utils.each(proto,(object,name) => {
			if(self.wiki.getTiddlerText(configPrefix + name,"enable") !== "enable") {
				delete proto[name];
			}
		});
	}
};

/*
Instantiate an array of parse rules
*/
WikiParser.prototype.instantiateRules = function(classes,type,startPos) {
	const rulesInfo = [];
	const self = this;
	$tw.utils.each(classes,(RuleClass) => {
		// Instantiate the rule
		const rule = new RuleClass(self);
		rule.is = {};
		rule.is[type] = true;
		rule.init(self);
		const matchIndex = rule.findNextMatch(startPos);
		if(matchIndex !== undefined) {
			rulesInfo.push({
				rule,
				matchIndex
			});
		}
	});
	return rulesInfo;
};

/*
Skip any whitespace at the current position. Options are:
	treatNewlinesAsNonWhitespace: true if newlines are NOT to be treated as whitespace
*/
WikiParser.prototype.skipWhitespace = function(options) {
	options = options || {};
	const whitespaceRegExp = options.treatNewlinesAsNonWhitespace ? /([^\S\n]+)/mg : /(\s+)/mg;
	whitespaceRegExp.lastIndex = this.pos;
	const whitespaceMatch = whitespaceRegExp.exec(this.source);
	if(whitespaceMatch && whitespaceMatch.index === this.pos) {
		this.pos = whitespaceRegExp.lastIndex;
	}
};

/*
Get the next match out of an array of parse rule instances
*/
WikiParser.prototype.findNextMatch = function(rules,startPos) {
	// Find the best matching rule by finding the closest match position
	let matchingRule;
	let matchingRulePos = this.sourceLength;
	// Step through each rule
	for(let t = 0;t < rules.length;t++) {
		const ruleInfo = rules[t];
		// Ask the rule to get the next match if we've moved past the current one
		if(ruleInfo.matchIndex !== undefined && ruleInfo.matchIndex < startPos) {
			ruleInfo.matchIndex = ruleInfo.rule.findNextMatch(startPos);
		}
		// Adopt this match if it's closer than the current best match
		if(ruleInfo.matchIndex !== undefined && ruleInfo.matchIndex <= matchingRulePos) {
			matchingRule = ruleInfo;
			matchingRulePos = ruleInfo.matchIndex;
		}
	}
	return matchingRule;
};

/*
Parse any pragmas at the beginning of a block of parse text
*/
WikiParser.prototype.parsePragmas = function() {
	let currentTreeBranch = this.tree;
	while(true) {
		const savedPos = this.pos;
		// Skip whitespace
		this.skipWhitespace();
		// Check for the end of the text
		if(this.pos >= this.sourceLength) {
			break;
		}
		// Check if we've arrived at a pragma rule match
		var nextMatch = this.findNextMatch(this.pragmaRules,this.pos);
		// If not, just exit
		if(!nextMatch || nextMatch.matchIndex !== this.pos) {
			this.pos = savedPos;
			break;
		}
		// Process the pragma rule
		const start = this.pos;
		const subTree = nextMatch.rule.parse();
		if(subTree.length > 0) {
			// Set the start and end positions of the pragma rule if
			if(subTree[0].start === undefined) subTree[0].start = start;
			if(subTree[subTree.length - 1].end === undefined) subTree[subTree.length - 1].end = this.pos;
			$tw.utils.each(subTree,(node) => {node.rule = nextMatch.rule.name;});
			// Quick hack; we only cope with a single parse tree node being returned, which is true at the moment
			currentTreeBranch.push.apply(currentTreeBranch,subTree);
			subTree[0].children = [];
			currentTreeBranch = subTree[0].children;
		}
		// Skip whitespace after the pragma
		this.skipWhitespace();
	}
	return currentTreeBranch;
};

/*
Parse a block from the current position
	terminatorRegExpString: optional regular expression string that identifies the end of plain paragraphs. Must not include capturing parenthesis
*/
WikiParser.prototype.parseBlock = function(terminatorRegExpString) {
	const terminatorRegExp = terminatorRegExpString ? new RegExp(`${terminatorRegExpString}|\\r?\\n\\r?\\n`,"mg") : /(\r?\n\r?\n)/mg;
	this.skipWhitespace();
	if(this.pos >= this.sourceLength) {
		return [];
	}
	// Look for a block rule that applies at the current position
	const nextMatch = this.findNextMatch(this.blockRules,this.pos);
	if(nextMatch && nextMatch.matchIndex === this.pos) {
		var start = this.pos;
		const subTree = nextMatch.rule.parse();
		// Set the start and end positions of the first and last blocks if they're not already set
		if(subTree.length > 0) {
			if(subTree[0].start === undefined) subTree[0].start = start;
			if(subTree[subTree.length - 1].end === undefined) subTree[subTree.length - 1].end = this.pos;
		}
		$tw.utils.each(subTree,(node) => {node.rule = nextMatch.rule.name;});
		return subTree;
	}
	// Treat it as a paragraph if we didn't find a block rule
	var start = this.pos;
	const children = this.parseInlineRun(terminatorRegExp);
	const end = this.pos;
	return [{type: "element",tag: "p",children,start,end}];
};

/*
Parse a series of blocks of text until a terminating regexp is encountered or the end of the text
	terminatorRegExpString: terminating regular expression
*/
WikiParser.prototype.parseBlocks = function(terminatorRegExpString) {
	if(terminatorRegExpString) {
		return this.parseBlocksTerminated(terminatorRegExpString);
	} else {
		return this.parseBlocksUnterminated();
	}
};

/*
Parse a block from the current position to the end of the text
*/
WikiParser.prototype.parseBlocksUnterminated = function() {
	const tree = [];
	while(this.pos < this.sourceLength) {
		tree.push.apply(tree,this.parseBlock());
	}
	return tree;
};

/*
Parse blocks of text until a terminating regexp is encountered. Wrapper for parseBlocksTerminatedExtended that just returns the parse tree
*/
WikiParser.prototype.parseBlocksTerminated = function(terminatorRegExpString) {
	const ex = this.parseBlocksTerminatedExtended(terminatorRegExpString);
	return ex.tree;
};

/*
Parse blocks of text until a terminating regexp is encountered
*/
WikiParser.prototype.parseBlocksTerminatedExtended = function(terminatorRegExpString) {
	const terminatorRegExp = new RegExp(terminatorRegExpString,"mg");
	const result = {
		tree: []
	};
	// Skip any whitespace
	this.skipWhitespace();
	//  Check if we've got the end marker
	terminatorRegExp.lastIndex = this.pos;
	let match = terminatorRegExp.exec(this.source);
	// Parse the text into blocks
	while(this.pos < this.sourceLength && !(match && match.index === this.pos)) {
		const blocks = this.parseBlock(terminatorRegExpString);
		result.tree.push.apply(result.tree,blocks);
		// Skip any whitespace
		this.skipWhitespace();
		//  Check if we've got the end marker
		terminatorRegExp.lastIndex = this.pos;
		match = terminatorRegExp.exec(this.source);
	}
	if(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		result.match = match;
	}
	return result;
};

/*
Parse a run of text at the current position
	terminatorRegExp: a regexp at which to stop the run
	options: see below
Options available:
	eatTerminator: move the parse position past any encountered terminator (default false)
*/
WikiParser.prototype.parseInlineRun = function(terminatorRegExp,options) {
	if(terminatorRegExp) {
		return this.parseInlineRunTerminated(terminatorRegExp,options);
	} else {
		return this.parseInlineRunUnterminated(options);
	}
};

WikiParser.prototype.parseInlineRunUnterminated = function(options) {
	const tree = [];
	// Find the next occurrence of an inline rule
	let nextMatch = this.findNextMatch(this.inlineRules,this.pos);
	// Loop around the matches until we've reached the end of the text
	while(this.pos < this.sourceLength && nextMatch) {
		// Process the text preceding the run rule
		if(nextMatch.matchIndex > this.pos) {
			this.pushTextWidget(tree,this.source.substring(this.pos,nextMatch.matchIndex),this.pos,nextMatch.matchIndex);
			this.pos = nextMatch.matchIndex;
		}
		// Process the run rule
		const start = this.pos;
		const subTree = nextMatch.rule.parse();
		// Set the start and end positions of the first and last child if they're not already set
		if(subTree.length > 0) {
			// Set the start and end positions of the first and last child if they're not already set
			if(subTree[0].start === undefined) subTree[0].start = start;
			if(subTree[subTree.length - 1].end === undefined) subTree[subTree.length - 1].end = this.pos;
		}
		$tw.utils.each(subTree,(node) => {node.rule = nextMatch.rule.name;});
		tree.push.apply(tree,subTree);
		// Look for the next run rule
		nextMatch = this.findNextMatch(this.inlineRules,this.pos);
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		this.pushTextWidget(tree,this.source.substr(this.pos),this.pos,this.sourceLength);
	}
	this.pos = this.sourceLength;
	return tree;
};

WikiParser.prototype.parseInlineRunTerminated = function(terminatorRegExp,options) {
	const ex = this.parseInlineRunTerminatedExtended(terminatorRegExp,options);
	return ex.tree;
};

WikiParser.prototype.parseInlineRunTerminatedExtended = function(terminatorRegExp,options) {
	options = options || {};
	const tree = [];
	// Find the next occurrence of the terminator
	terminatorRegExp.lastIndex = this.pos;
	let terminatorMatch = terminatorRegExp.exec(this.source);
	// Find the next occurrence of a inlinerule
	let inlineRuleMatch = this.findNextMatch(this.inlineRules,this.pos);
	// Loop around until we've reached the end of the text
	while(this.pos < this.sourceLength && (terminatorMatch || inlineRuleMatch)) {
		// Return if we've found the terminator, and it precedes any inline rule match
		if(terminatorMatch) {
			if(!inlineRuleMatch || inlineRuleMatch.matchIndex >= terminatorMatch.index) {
				if(terminatorMatch.index > this.pos) {
					this.pushTextWidget(tree,this.source.substring(this.pos,terminatorMatch.index),this.pos,terminatorMatch.index);
				}
				this.pos = terminatorMatch.index;
				if(options.eatTerminator) {
					this.pos += terminatorMatch[0].length;
				}
				return {
					match: terminatorMatch,
					tree
				};
			}
		}
		// Process any inline rule, along with the text preceding it
		if(inlineRuleMatch) {
			// Preceding text
			if(inlineRuleMatch.matchIndex > this.pos) {
				this.pushTextWidget(tree,this.source.substring(this.pos,inlineRuleMatch.matchIndex),this.pos,inlineRuleMatch.matchIndex);
				this.pos = inlineRuleMatch.matchIndex;
			}
			// Process the inline rule
			const start = this.pos;
			const subTree = inlineRuleMatch.rule.parse();
			// Set the start and end positions of the first and last child if they're not already set
			if(subTree.length > 0) {
				if(subTree[0].start === undefined) subTree[0].start = start;
				if(subTree[subTree.length - 1].end === undefined) subTree[subTree.length - 1].end = this.pos;
			}
			$tw.utils.each(subTree,(node) => {node.rule = inlineRuleMatch.rule.name;});
			tree.push.apply(tree,subTree);
			// Look for the next inline rule
			inlineRuleMatch = this.findNextMatch(this.inlineRules,this.pos);
			// Look for the next terminator match
			terminatorRegExp.lastIndex = this.pos;
			terminatorMatch = terminatorRegExp.exec(this.source);
		}
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		this.pushTextWidget(tree,this.source.substr(this.pos),this.pos,this.sourceLength);
	}
	this.pos = this.sourceLength;
	return {
		tree
	};
};

/*
Push a text widget onto an array, respecting the configTrimWhiteSpace setting
*/
WikiParser.prototype.pushTextWidget = function(array,text,start,end) {
	if(this.configTrimWhiteSpace) {
		text = $tw.utils.trim(text);
	}
	if(text) {
		array.push({type: "text",text,start,end});
	}
};

/*
Parse zero or more class specifiers `.classname`
*/
WikiParser.prototype.parseClasses = function() {
	const classRegExp = /\.([^\s\.]+)/mg;
	const classNames = [];
	classRegExp.lastIndex = this.pos;
	let match = classRegExp.exec(this.source);
	while(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		classNames.push(match[1]);
		match = classRegExp.exec(this.source);
	}
	return classNames;
};

/*
Amend the rules used by this instance of the parser
	type: `only` keeps just the named rules, `except` keeps all but the named rules
	names: array of rule names
*/
WikiParser.prototype.amendRules = function(type,names) {
	names = names || [];
	// Define the filter function
	let target;
	if(type === "only") {
		target = true;
	} else if(type === "except") {
		target = false;
	} else {
		return;
	}
	// Define a function to process each of our rule arrays
	const processRuleArray = function(ruleArray) {
		for(let t = ruleArray.length - 1;t >= 0;t--) {
			if((!names.includes(ruleArray[t].rule.name)) === target) {
				ruleArray.splice(t,1);
			}
		}
	};
	// Process each rule array
	processRuleArray(this.pragmaRules);
	processRuleArray(this.blockRules);
	processRuleArray(this.inlineRules);
};

exports["text/vnd.tiddlywiki"] = WikiParser;
