/*\
title: $:/core/modules/parsers/wikiparser/wikiparser.js
type: application/javascript
module-type: global

The wiki text parser processes blocks of source text into a parse tree.

The parse tree is made up of nested arrays of these JavaScript objects:

	{type: "element", tag: <string>, attributes: {}, children: []} - an HTML element
	{type: "text", text: <string>} - a text node
	{type: "entity", value: <string>} - an entity
	{type: "raw", html: <string>} - raw HTML

Attributes are stored as hashmaps of the following objects:

	{type: "string", value: <string>} - literal string
	{type: "array", value: <string array>} - array of strings
	{type: "styles", value: <object>} - hashmap of style strings
	{type: "indirect", textReference: <textReference>} - indirect through a text reference

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var WikiParser = function(vocabulary,type,text,options) {
	this.wiki = options.wiki;
	this.vocabulary = vocabulary;
	// Save the parse text
	this.type = type || "text/vnd.tiddlywiki";
	this.source = text || "";
	this.sourceLength = this.source.length;
	// Set current parse position
	this.pos = 0;
	// Initialise the things that pragma rules can change
	this.macroDefinitions = {}; // Hash map of macro definitions
	// Instantiate the pragma parse rules
	this.pragmaRules = this.instantiateRules(this.vocabulary.pragmaRuleClasses,0);
	// Parse any pragmas
	this.parsePragmas();
	// Instantiate the parser block and run rules
	this.blockRules = this.instantiateRules(this.vocabulary.blockRuleClasses,this.pos);
	this.runRules = this.instantiateRules(this.vocabulary.runRuleClasses,this.pos);
	// Parse the text into runs or blocks
	if(this.type === "text/vnd.tiddlywiki-run") {
		this.tree = this.parseRun();
	} else {
		this.tree = this.parseBlocks();
	}
};

/*
Instantiate an array of parse rules
*/
WikiParser.prototype.instantiateRules = function(classes,startPos) {
	var rules = [],
		self = this;
	$tw.utils.each(classes,function(RuleClass) {
		// Instantiate the rule
		var rule = new RuleClass(self,startPos);
		// Only save the rule if there is at least one match
		if(rule.matchIndex !== undefined) {
			rules.push(rule);
		}
	});
	return rules;
};

/*
Skip any whitespace at the current position. Options are:
	treatNewlinesAsNonWhitespace: true if newlines are NOT to be treated as whitespace
*/
WikiParser.prototype.skipWhitespace = function(options) {
	options = options || {};
	var whitespaceRegExp = options.treatNewlinesAsNonWhitespace ? /([^\S\n]+)/mg : /(\s+)/mg;
	whitespaceRegExp.lastIndex = this.pos;
	var whitespaceMatch = whitespaceRegExp.exec(this.source);
	if(whitespaceMatch && whitespaceMatch.index === this.pos) {
		this.pos = whitespaceRegExp.lastIndex;
	}
};

/*
Get the next match out of an array of parse rule instances
*/
WikiParser.prototype.findNextMatch = function(rules,startPos) {
	var nextMatch = undefined,
		nextMatchPos = this.sourceLength;
	for(var t=0; t<rules.length; t++) {
		var matchPos = rules[t].findNextMatch(startPos);
		if(matchPos !== undefined && matchPos <= nextMatchPos) {
			nextMatch = rules[t];
			nextMatchPos = matchPos;
		}
	}
	return nextMatch;
};

/*
Parse any pragmas at the beginning of a block of parse text
*/
WikiParser.prototype.parsePragmas = function() {
	while(true) {
		// Skip whitespace
		this.skipWhitespace();
		// Check for the end of the text
		if(this.pos >= this.sourceLength) {
			return;
		}
		// Check if we've arrived at a pragma rule match
		var nextMatch = this.findNextMatch(this.pragmaRules,this.pos);
		// If not, just exit
		if(!nextMatch || nextMatch.matchIndex !== this.pos) {
			return;
		}
		// Process the pragma rule
		nextMatch.parse();
	}
};

/*
Parse a block from the current position
	terminatorRegExpString: optional regular expression string that identifies the end of plain paragraphs. Must not include capturing parenthesis
*/
WikiParser.prototype.parseBlock = function(terminatorRegExpString) {
	var terminatorRegExp = terminatorRegExpString ? new RegExp("(" + terminatorRegExpString + "|\\r?\\n\\r?\\n)","mg") : /(\r?\n\r?\n)/mg;
	this.skipWhitespace();
	if(this.pos >= this.sourceLength) {
		return [];
	}
	// Look for a block rule that applies at the current position
	var nextMatch = this.findNextMatch(this.blockRules,this.pos);
	if(nextMatch && nextMatch.matchIndex === this.pos) {
		return nextMatch.parse();
	}
	// Treat it as a paragraph if we didn't find a block rule
	return [{type: "element", tag: "p", children: this.parseRun(terminatorRegExp)}];
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
	var tree = [];
	while(this.pos < this.sourceLength) {
		tree.push.apply(tree,this.parseBlock());
	}
	return tree;
};

/*
Parse blocks of text until a terminating regexp is encountered
*/
WikiParser.prototype.parseBlocksTerminated = function(terminatorRegExpString) {
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
*/
WikiParser.prototype.parseRun = function(terminatorRegExp) {
	if(terminatorRegExp) {
		return this.parseRunTerminated(terminatorRegExp);
	} else {
		return this.parseRunUnterminated();
	}
};

WikiParser.prototype.parseRunUnterminated = function() {
	var tree = [];
	// Find the next occurrence of a runrule
	var nextMatch = this.findNextMatch(this.runRules,this.pos);
	// Loop around the matches until we've reached the end of the text
	while(this.pos < this.sourceLength && nextMatch) {
		// Process the text preceding the run rule
		if(nextMatch.matchIndex > this.pos) {
			tree.push({type: "text", text: this.source.substring(this.pos,nextMatch.matchIndex)});
			this.pos = nextMatch.matchIndex;
		}
		// Process the run rule
		tree.push.apply(tree,nextMatch.parse());
		// Look for the next run rule
		nextMatch = this.findNextMatch(this.runRules,this.pos);
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		tree.push({type: "text", text: this.source.substr(this.pos)});
	}
	this.pos = this.sourceLength;
	return tree;
};

WikiParser.prototype.parseRunTerminated = function(terminatorRegExp) {
	var tree = [];
	// Find the next occurrence of the terminator
	terminatorRegExp.lastIndex = this.pos;
	var terminatorMatch = terminatorRegExp.exec(this.source);
	// Find the next occurrence of a runrule
	var runRuleMatch = this.findNextMatch(this.runRules,this.pos);
	// Loop around until we've reached the end of the text
	while(this.pos < this.sourceLength && (terminatorMatch || runRuleMatch)) {
		// Return if we've found the terminator, and it precedes any run rule match
		if(terminatorMatch) {
			if(!runRuleMatch || runRuleMatch.matchIndex >= terminatorMatch.index) {
				if(terminatorMatch.index > this.pos) {
					tree.push({type: "text", text: this.source.substring(this.pos,terminatorMatch.index)});
				}
				this.pos = terminatorMatch.index;
				return tree;
			}
		}
		// Process any run rule, along with the text preceding it
		if(runRuleMatch) {
			// Preceding text
			if(runRuleMatch.matchIndex > this.pos) {
				tree.push({type: "text", text: this.source.substring(this.pos,runRuleMatch.matchIndex)});
				this.pos = runRuleMatch.matchIndex;
			}
			// Process the run rule
			tree.push.apply(tree,runRuleMatch.parse());
			// Look for the next run rule
			runRuleMatch = this.findNextMatch(this.runRules,this.pos);
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
Parse a run of text preceded by zero or more class specifiers `.classname`
*/
WikiParser.prototype.parseClassedRun = function(terminatorRegExp) {
	var classRegExp = /\.([^\s\.]+)/mg,
		classNames = [];
	classRegExp.lastIndex = this.pos;
	var match = classRegExp.exec(this.source);
	while(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		classNames.push(match[1]);
		var match = classRegExp.exec(this.source);
	}
	this.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	var tree = this.parseRun(terminatorRegExp);
	return {
		"class": classNames.join(" "),
		tree: tree
	};
};

exports.WikiParser = WikiParser;

})();

