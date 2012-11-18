/*\
title: $:/core/modules/parsers/wikitextparser/wikitextparser.js
type: application/javascript
module-type: parser

A new-school wikitext parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Define the wikitext renderer constructor
*/
var WikiTextRenderer = function(text,options) {
	this.source = text || "";
	this.sourceLength = this.source.length;
	this.pos = 0;
	this.wiki = options.wiki;
	this.parser = options.parser;
	this.tree = [];
	this.dependencies = new $tw.Dependencies();
	// Parse the text into runs or blocks
	if(options.isRun) {
		this.tree.push.apply(this.tree,this.parseRun());
	} else {
		this.tree.push.apply(this.tree,this.parseBlocks());
	}
};

/*
Now make WikiTextRenderer inherit from the default Renderer class
*/
var Renderer = require("$:/core/modules/renderer.js").Renderer;
WikiTextRenderer.prototype = new Renderer();
WikiTextRenderer.constructor = WikiTextRenderer;

/*
Parse a block from the current position
	terminatorRegExpString: optional regular expression string that identifies the end of plain paragraphs. Must not include capturing parenthesis
	options: see below
Options are:
	leaveTerminator: True if the terminator shouldn't be consumed
*/
WikiTextRenderer.prototype.parseBlock = function(terminatorRegExpString,options) {
	var terminatorRegExp = terminatorRegExpString ? new RegExp("(" + terminatorRegExpString + "|\\r?\\n\\r?\\n)","mg") : /(\r?\n\r?\n)/mg;
	this.skipWhitespace();
	if(this.pos >= this.sourceLength) {
		return [];
	}
	// Look for a block rule
	this.parser.blockRegExp.lastIndex = this.pos;
	var match = this.parser.blockRegExp.exec(this.source);
	if(this.parser.blockRules.length && match && match.index === this.pos) {
		var rule;
		for(var t=0; t<this.parser.blockRules.length; t++) {
			if(match[t+1]) {
				rule = this.parser.blockRules[t];
			}
		}
		return rule ? rule.parse.call(this,match,true) : [];
	} else {
		// Treat it as a paragraph if we didn't find a block rule
		return [$tw.Tree.Element("p",{},this.parseRun(terminatorRegExp,options))];
	}
};

/*
Parse blocks of text until a terminating regexp is encountered or the end of the text
	terminatorRegExpString: terminating regular expression
	options: none at present
*/
WikiTextRenderer.prototype.parseBlocks = function(terminatorRegExpString,options) {
	if(terminatorRegExpString) {
		return this.parseBlocksTerminated(terminatorRegExpString,options);
	} else {
		return this.parseBlocksUnterminated(options);
	}
};

/*
Parse a block from the current position to the end of the text
*/
WikiTextRenderer.prototype.parseBlocksUnterminated = function(options) {
	var tree = [];
	while(this.pos < this.sourceLength) {
		tree.push.apply(tree,this.parseBlock());
	}
	return tree;
};

/*
Parse blocks of text until a terminating regexp is encountered. See parseBlocks() for details
*/
WikiTextRenderer.prototype.parseBlocksTerminated = function(terminatorRegExpString,options) {
	options = options || {};
	var terminatorRegExp = new RegExp("(" + terminatorRegExpString + ")","mg"),
		tree = [];
	// Skip any whitespace
	this.skipWhitespace();
	//  Check if we've got the end marker
	terminatorRegExp.lastIndex = this.pos;
	var match = terminatorRegExp.exec(this.source);
	// Parse the text into blocks
	while(this.pos < this.sourceLength && !(match && match.index === this.pos)) {
		var blocks = this.parseBlock(terminatorRegExpString,{leaveTerminator: true});
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

WikiTextRenderer.prototype.skipWhitespace = function() {
	var whitespaceRegExp = /(\s+)/mg;
	whitespaceRegExp.lastIndex = this.pos;
	var whitespaceMatch = whitespaceRegExp.exec(this.source);
	if(whitespaceMatch && whitespaceMatch.index === this.pos) {
		this.pos = whitespaceRegExp.lastIndex;
	}
};

/*
Parse a run of text at the current position
	terminatorRegExp: a regexp at which to stop the run
	options: see below

Options are:
	leaveTerminator: true if the terminator shouldn't be consumed
Returns an array of tree nodes
*/
WikiTextRenderer.prototype.parseRun = function(terminatorRegExp,options) {
	if(terminatorRegExp) {
		return this.parseRunTerminated(terminatorRegExp,options);
	} else {
		return this.parseRunUnterminated(options);
	}
};

WikiTextRenderer.prototype.parseRunUnterminated = function(options) {
	options = options || {};
	var tree = [];
	// Find the next occurrence of a runrule
	this.parser.runRegExp.lastIndex = this.pos;
	var runRuleMatch = this.parser.runRegExp.exec(this.source);
	// Loop around until we've reached the end of the text
	while(this.pos < this.sourceLength && runRuleMatch) {
		// Process the text preceding the run rule
		if(runRuleMatch.index > this.pos) {
			tree.push($tw.Tree.Text(this.source.substring(this.pos,runRuleMatch.index)));
			this.pos = runRuleMatch.index;
		}
		// Process the run rule
		var rule;
		for(var t=0; t<this.parser.runRules.length; t++) {
			if(runRuleMatch[t+1]) {
				rule = this.parser.runRules[t];
			}
		}
		if(rule) {
			tree.push.apply(tree,rule.parse.call(this,runRuleMatch,false));
		}
		// Look for the next run rule
		this.parser.runRegExp.lastIndex = this.pos;
		runRuleMatch = this.parser.runRegExp.exec(this.source);
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		tree.push($tw.Tree.Text(this.source.substr(this.pos)));
	}
	this.pos = this.sourceLength;
	return tree;
};

WikiTextRenderer.prototype.parseRunTerminated = function(terminatorRegExp,options) {
	options = options || {};
	var tree = [];
	// Find the next occurrence of the terminator
	terminatorRegExp.lastIndex = this.pos;
	var terminatorMatch = terminatorRegExp.exec(this.source);
	// Find the next occurrence of a runrule
	this.parser.runRegExp.lastIndex = this.pos;
	var runRuleMatch = this.parser.runRegExp.exec(this.source);
	// Loop around until we've reached the end of the text
	while(this.pos < this.sourceLength && (terminatorMatch || runRuleMatch)) {
		// Return if we've found the terminator, and it precedes any run rule match
		if(terminatorMatch) {
			if(!runRuleMatch || runRuleMatch.index >= terminatorMatch.index) {
				if(terminatorMatch.index > this.pos) {
					tree.push($tw.Tree.Text(this.source.substring(this.pos,terminatorMatch.index)));
				}
				this.pos = terminatorMatch.index;
				if(!options.leaveTerminator) {
					this.pos += terminatorMatch[0].length;
				}
				return tree;
			}
		}
		// Process any run rule, along with the text preceding it
		if(runRuleMatch) {
			// Preceding text
			if(runRuleMatch.index > this.pos) {
				tree.push($tw.Tree.Text(this.source.substring(this.pos,runRuleMatch.index)));
				this.pos = runRuleMatch.index;
			}
			// Process the run rule
			var rule;
			for(var t=0; t<this.parser.runRules.length; t++) {
				if(runRuleMatch[t+1]) {
					rule = this.parser.runRules[t];
				}
			}
			if(rule) {
				tree.push.apply(tree,rule.parse.call(this,runRuleMatch,false));
			}
			// Look for the next run rule and the next terminator match
			this.parser.runRegExp.lastIndex = this.pos;
			runRuleMatch = this.parser.runRegExp.exec(this.source);
			terminatorRegExp.lastIndex = this.pos;
			terminatorMatch = terminatorRegExp.exec(this.source);
		}
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		tree.push($tw.Tree.Text(this.source.substr(this.pos)));
	}
	this.pos = this.sourceLength;
	return tree;
};

/*
Parse a run of text preceded by an optional class specifier `{{class}}`
*/
WikiTextRenderer.prototype.parseClassedRun = function(terminatorRegExp) {
	var classRegExp = /\{\{([^\}]*)\}\}/mg,
		className;
	classRegExp.lastIndex = this.pos;
	var match = classRegExp.exec(this.source);
	if(match && match.index === this.pos) {
		className = match[1];
		this.pos = match.index + match[0].length;
	}
	var tree = this.parseRun(terminatorRegExp);
	return {
		"class": className,
		tree: tree
	};
};

/*
The wikitext parser assembles the rules and uses the wikitext renderer to do the parsing
*/
var WikiTextParser = function(options) {
	this.wiki = options.wiki;
	// Assemble the rule regexps
	this.blockRules = [];
	this.runRules = [];
	var blockRegExpStrings = [],
		runRegExpStrings = [],
		self = this;
	$tw.modules.forEachModuleOfType("wikitextrule",function(title,module) {
		if(module.blockParser) {
			self.blockRules.push(module);
			blockRegExpStrings.push("(" + module.regExpString + ")");
		}
		if(module.runParser) {
			self.runRules.push(module);
			runRegExpStrings.push("(" + module.regExpString + ")");
		}
	});
	this.blockRegExp = new RegExp(blockRegExpStrings.join("|"),"mg");
	this.runRegExp = new RegExp(runRegExpStrings.join("|"),"mg");
};

/*
The wikitext parser constructs a wikitext renderer to do the work
*/
WikiTextParser.prototype.parse = function(type,text) {
	return new WikiTextRenderer(text,{
		wiki: this.wiki,
		parser: this,
		isRun: type === "text/vnd.tiddlywiki-run"
	});
};

exports["text/vnd.tiddlywiki"] = WikiTextParser;

exports["text/vnd.tiddlywiki-run"] = WikiTextParser;

})();
