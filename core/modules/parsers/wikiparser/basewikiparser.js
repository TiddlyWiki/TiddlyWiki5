/*\
title: $:/core/modules/parsers/wikiparser/basewikiparser.js
type: application/javascript
module-type: global

base class- individual wikiparser inherit from this class

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var baseWikiParser = function(specifier) {
	
	this.type = specifier.type;
	this.source = specifier.source;
	this.options =specifier.options;
	this.wiki = this.options.wiki;
	this.pragmaRuleClasses=specifier.pragmaRuleClasses;
	this.blockRuleClasses=specifier.blockRuleClasses;
	this.inlineRuleClasses=specifier.inlineRuleClasses;

	this.sourceLength = this.source.length;
	// Set current parse position
	this.pos = 0;
	// Instantiate the pragma parse rules
	this.pragmaRules = this.instantiateRules(this.pragmaRuleClasses,"pragma",0);
	// Instantiate the parser block and inline rules
	this.blockRules = this.instantiateRules(this.blockRuleClasses,"block",0);
	this.inlineRules = this.instantiateRules(this.inlineRuleClasses,"inline",0);
	// Parse any pragmas
	this.tree = this.parsePragmas();
	// Parse the text into inline runs or blocks
	if(this.options.parseAsInline) {
		this.tree.push.apply(this.tree,this.parseInlineRun());
	} else {
		this.tree.push.apply(this.tree,this.parseBlocks());
	}
	// Return the parse tree
};

/*
Instantiate an array of parse rules
*/
baseWikiParser.prototype.instantiateRules = function(classes,type,startPos) {
	var rulesInfo = [],
		self = this;
	if (classes instanceof Array) {
		for (var i=0; i < classes.length; i++) {
			// Instantiate the rule
			var rule = new classes[i](self);
			rule.is = {};
			rule.is[type] = true;
			rule.init(self);
			var matchIndex = rule.findNextMatch(startPos);
			if(matchIndex !== undefined) {
				rulesInfo.push({
					rule: rule,
					matchIndex: matchIndex
				});
			}
		}
	}
	else $tw.utils.each(classes,function(RuleClass) {
		// Instantiate the rule
		var rule = new RuleClass(self);
		rule.is = {};
		rule.is[type] = true;
		rule.init(self);
		var matchIndex = rule.findNextMatch(startPos);
		if(matchIndex !== undefined) {
			rulesInfo.push({
				rule: rule,
				matchIndex: matchIndex
			});
		}
	});
	return rulesInfo;
};

/*
Skip any whitespace at the current position. Options are:
	treatNewlinesAsNonWhitespace: true if newlines are NOT to be treated as whitespace
*/
baseWikiParser.prototype.skipWhitespace = function() {
	
	var whitespaceRegExp = this.options.treatNewlinesAsNonWhitespace ? /([^\S\n]+)/mg : /(\s+)/mg;
	whitespaceRegExp.lastIndex = this.pos;
	var whitespaceMatch = whitespaceRegExp.exec(this.source);
	if(whitespaceMatch && whitespaceMatch.index === this.pos) {
		this.pos = whitespaceRegExp.lastIndex;
	}
};

/*
Get the next match out of an array of parse rule instances
*/
baseWikiParser.prototype.findNextMatch = function(rules,startPos) {
	// Find the best matching rule by finding the closest match position
	var matchingRule = undefined,
		matchingRulePos = this.sourceLength;
	// Step through each rule
	for(var t=0; t<rules.length; t++) {
		var ruleInfo = rules[t];
		// Ask the rule to get the next match if we've moved past the current one
		if(ruleInfo.matchIndex !== undefined  && ruleInfo.matchIndex < startPos) {
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
baseWikiParser.prototype.parsePragmas = function() {
	var tree = [];
	while(true) {
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
			break;
		}
		// Process the pragma rule
		tree.push.apply(tree,nextMatch.rule.parse());
	}
	return tree;
};

/*
Parse a block from the current position
	terminatorRegExpString: optional regular expression string that identifies the end of plain paragraphs. Must not include capturing parenthesis
*/
baseWikiParser.prototype.parseBlock = function(terminatorRegExpString) {
	var terminatorRegExp = terminatorRegExpString ? new RegExp("(" + terminatorRegExpString + "|\\r?\\n\\r?\\n)","mg") : /(\r?\n\r?\n)/mg;
	this.skipWhitespace();
	if(this.pos >= this.sourceLength) {
		return [];
	}
	// Look for a block rule that applies at the current position
	var nextMatch = this.findNextMatch(this.blockRules,this.pos);
	if(nextMatch && nextMatch.matchIndex === this.pos) {
		return nextMatch.rule.parse();
	}
	// Treat it as a paragraph if we didn't find a block rule
	return [{type: "element", tag: "p", children: this.parseInlineRun(terminatorRegExp)}];
};

/*
Parse a series of blocks of text until a terminating regexp is encountered or the end of the text
	terminatorRegExpString: terminating regular expression
*/
baseWikiParser.prototype.parseBlocks = function(terminatorRegExpString) {
	if(terminatorRegExpString) {
		return this.parseBlocksTerminated(terminatorRegExpString);
	} else {
		return this.parseBlocksUnterminated();
	}
};

/*
Parse a block from the current position to the end of the text
*/
baseWikiParser.prototype.parseBlocksUnterminated = function() {
	var tree = [];
	while(this.pos < this.sourceLength) {
		tree.push.apply(tree,this.parseBlock());
	}
	return tree;
};

/*
Parse blocks of text until a terminating regexp is encountered
*/
baseWikiParser.prototype.parseBlocksTerminated = function(terminatorRegExpString) {
	var terminatorRegExp = new RegExp("(" + terminatorRegExpString + ")","mg"),
		tree = [];
	// Skip any whitespace
	this.skipWhitespace();
	//  Check if we've got the end marker
	terminatorRegExp.lastIndex = this.pos;
	var match = terminatorRegExp.exec(this.source);
	// Parse the text into blocks
	while(this.pos < this.sourceLength && !(match && match.index === this.pos)) {
		var blocks = this.parseBlock(terminatorRegExpString);
		tree.push.apply(tree,blocks);
		// Skip any whitespace
		this.skipWhitespace();
		//  Check if we've got the end marker
		terminatorRegExp.lastIndex = this.pos;
		match = terminatorRegExp.exec(this.source);
	}
	if(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
	}
	return tree;
};

/*
Parse a run of text at the current position
	terminatorRegExp: a regexp at which to stop the run
	options: see below
Options available:
	eatTerminator: move the parse position past any encountered terminator (default false)
*/
baseWikiParser.prototype.parseInlineRun = function(terminatorRegExp,options) {
	if(terminatorRegExp) {
		return this.parseInlineRunTerminated(terminatorRegExp,options);
	} else {
		return this.parseInlineRunUnterminated(options);
	}
};

baseWikiParser.prototype.parseInlineRunUnterminated = function(options) {
	var tree = [];
	// Find the next occurrence of an inline rule
	var nextMatch = this.findNextMatch(this.inlineRules,this.pos);
	// Loop around the matches until we've reached the end of the text
	while(this.pos < this.sourceLength && nextMatch) {
		// Process the text preceding the run rule
		if(nextMatch.matchIndex > this.pos) {
			tree.push({type: "text", text: this.source.substring(this.pos,nextMatch.matchIndex)});
			this.pos = nextMatch.matchIndex;
		}
		// Process the run rule
		tree.push.apply(tree,nextMatch.rule.parse());
		// Look for the next run rule
		nextMatch = this.findNextMatch(this.inlineRules,this.pos);
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		tree.push({type: "text", text: this.source.substr(this.pos)});
	}
	this.pos = this.sourceLength;
	return tree;
};

baseWikiParser.prototype.parseInlineRunTerminated = function(terminatorRegExp,options) {
	options = options || {};
	var tree = [];
	// Find the next occurrence of the terminator
	terminatorRegExp.lastIndex = this.pos;
	var terminatorMatch = terminatorRegExp.exec(this.source);
	// Find the next occurrence of a inlinerule
	var inlineRuleMatch = this.findNextMatch(this.inlineRules,this.pos);
	// Loop around until we've reached the end of the text
	while(this.pos < this.sourceLength && (terminatorMatch || inlineRuleMatch)) {
		// Return if we've found the terminator, and it precedes any inline rule match
		if(terminatorMatch) {
			if(!inlineRuleMatch || inlineRuleMatch.matchIndex >= terminatorMatch.index) {
				if(terminatorMatch.index > this.pos) {
					tree.push({type: "text", text: this.source.substring(this.pos,terminatorMatch.index)});
				}
				this.pos = terminatorMatch.index;
				if(options.eatTerminator) {
					this.pos += terminatorMatch[0].length;
				}
				return tree;
			}
		}
		// Process any inline rule, along with the text preceding it
		if(inlineRuleMatch) {
			// Preceding text
			if(inlineRuleMatch.matchIndex > this.pos) {
				tree.push({type: "text", text: this.source.substring(this.pos,inlineRuleMatch.matchIndex)});
				this.pos = inlineRuleMatch.matchIndex;
			}
			// Process the inline rule
			tree.push.apply(tree,inlineRuleMatch.rule.parse());
			// Look for the next inline rule
			inlineRuleMatch = this.findNextMatch(this.inlineRules,this.pos);
			// Look for the next terminator match
			terminatorRegExp.lastIndex = this.pos;
			terminatorMatch = terminatorRegExp.exec(this.source);
		}
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		tree.push({type: "text", text: this.source.substr(this.pos)});
	}
	this.pos = this.sourceLength;
	return tree;
};

/*
Parse zero or more class specifiers `.classname`
*/
baseWikiParser.prototype.parseClasses = function() {
	var classRegExp = /\.([^\s\.]+)/mg,
		classNames = [];
	classRegExp.lastIndex = this.pos;
	var match = classRegExp.exec(this.source);
	while(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		classNames.push(match[1]);
		var match = classRegExp.exec(this.source);
	}
	return classNames;
};

/*
Amend the rules used by this instance of the parser
	type: `only` keeps just the named rules, `except` keeps all but the named rules
	names: array of rule names
*/
baseWikiParser.prototype.amendRules = function(type,names) {
	names = names || [];
	// Define the filter function
	var keepFilter;
	if(type === "only") {
		keepFilter = function(name) {
			return names.indexOf(name) !== -1;
		};
	} else if(type === "except") {
		keepFilter = function(name) {
			return names.indexOf(name) === -1;
		};
	} else {
		return;
	}
	// Define a function to process each of our rule arrays
	var processRuleArray = function(ruleArray) {
		for(var t=ruleArray.length-1; t>=0; t--) {
			if(!keepFilter(ruleArray[t].rule.name)) {
				ruleArray.splice(t,1);
			}
		}
	};
	// Process each rule array
	processRuleArray(this.pragmaRules);
	processRuleArray(this.blockRules);
	processRuleArray(this.inlineRules);
	return this;
}

exports["baseWikiParser"] = baseWikiParser;

})();

