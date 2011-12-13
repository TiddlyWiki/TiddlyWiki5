/*\
title: js/WikiTextParser.js

Parses a block of tiddlywiki-format wiki text into a parse tree object.

HTML elements are stored in the tree like this:

	{type: "div", attributes: {
			attr1: value,
			style: {
				name: value,
				name2: value2
			}
		}, children: [
			{child},
			{child},		
		]}

Text nodes are:

	{type: "text", value: "string of text node"}

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextRenderer = require("./WikiTextRenderer.js").WikiTextRenderer,
	utils = require("./Utils.js"),
	util = require("util");

var WikiTextParser = function(text,processor) {
	this.processor = processor;
	this.autoLinkWikiWords = true;
	this.source = text;
	this.nextMatch = 0;
	this.children = [];
	this.output = null;
	this.subWikify(this.children);
};

WikiTextParser.prototype.outputText = function(place,startPos,endPos) {
	if(startPos < endPos) {
		place.push({type: "text", value: this.source.substring(startPos,endPos)});
	}
};

WikiTextParser.prototype.subWikify = function(output,terminator) {
	// Handle the terminated and unterminated cases separately, this speeds up wikifikation by about 30%
	if(terminator)
		this.subWikifyTerm(output,new RegExp("(" + terminator + ")","mg"));
	else
		this.subWikifyUnterm(output);
};

WikiTextParser.prototype.subWikifyUnterm = function(output) {
	// subWikify can be indirectly recursive, so we need to save the old output pointer
	var oldOutput = this.output;
	this.output = output;
	// Get the first match
	this.processor.rulesRegExp.lastIndex = this.nextMatch;
	var ruleMatch = this.processor.rulesRegExp.exec(this.source);
	while(ruleMatch) {
		// Output any text before the match
		if(ruleMatch.index > this.nextMatch)
			this.outputText(this.output,this.nextMatch,ruleMatch.index);
		// Set the match parameters for the handler
		this.matchStart = ruleMatch.index;
		this.matchLength = ruleMatch[0].length;
		this.matchText = ruleMatch[0];
		this.nextMatch = this.processor.rulesRegExp.lastIndex;
		// Figure out which rule matched and call its handler
		var t;
		for(t=1; t<ruleMatch.length; t++) {
			if(ruleMatch[t]) {
				this.processor.rules[t-1].handler(this);
				this.processor.rulesRegExp.lastIndex = this.nextMatch;
				break;
			}
		}
		// Get the next match
		ruleMatch = this.processor.rulesRegExp.exec(this.source);
	}
	// Output any text after the last match
	if(this.nextMatch < this.source.length) {
		this.outputText(this.output,this.nextMatch,this.source.length);
		this.nextMatch = this.source.length;
	}
	// Restore the output pointer
	this.output = oldOutput;
};

WikiTextParser.prototype.subWikifyTerm = function(output,terminatorRegExp) {
	// subWikify can be indirectly recursive, so we need to save the old output pointer
	var oldOutput = this.output;
	this.output = output;
	// Get the first matches for the rule and terminator RegExps
	terminatorRegExp.lastIndex = this.nextMatch;
	var terminatorMatch = terminatorRegExp.exec(this.source);
	this.processor.rulesRegExp.lastIndex = this.nextMatch;
	var ruleMatch = this.processor.rulesRegExp.exec(terminatorMatch ? this.source.substr(0,terminatorMatch.index) : this.source);
	while(terminatorMatch || ruleMatch) {
		// Check for a terminator match before the next rule match
		if(terminatorMatch && (!ruleMatch || terminatorMatch.index <= ruleMatch.index)) {
			// Output any text before the match
			if(terminatorMatch.index > this.nextMatch)
				this.outputText(this.output,this.nextMatch,terminatorMatch.index);
			// Set the match parameters
			this.matchText = terminatorMatch[1];
			this.matchLength = terminatorMatch[1].length;
			this.matchStart = terminatorMatch.index;
			this.nextMatch = this.matchStart + this.matchLength;
			// Restore the output pointer
			this.output = oldOutput;
			return;
		}
		// It must be a rule match; output any text before the match
		if(ruleMatch.index > this.nextMatch)
			this.outputText(this.output,this.nextMatch,ruleMatch.index);
		// Set the match parameters
		this.matchStart = ruleMatch.index;
		this.matchLength = ruleMatch[0].length;
		this.matchText = ruleMatch[0];
		this.nextMatch = this.processor.rulesRegExp.lastIndex;
		// Figure out which rule matched and call its handler
		var t;
		for(t=1; t<ruleMatch.length; t++) {
			if(ruleMatch[t]) {
				this.processor.rules[t-1].handler(this);
				this.processor.rulesRegExp.lastIndex = this.nextMatch;
				break;
			}
		}
		// Get the next match
		terminatorRegExp.lastIndex = this.nextMatch;
		terminatorMatch = terminatorRegExp.exec(this.source);
		ruleMatch = this.processor.rulesRegExp.exec(terminatorMatch ? this.source.substr(0,terminatorMatch.index) : this.source);
	}
	// Output any text after the last match
	if(this.nextMatch < this.source.length) {
		this.outputText(this.output,this.nextMatch,this.source.length);
		this.nextMatch = this.source.length;
	}
	// Restore the output pointer
	this.output = oldOutput;
};

WikiTextParser.prototype.render = function(type,treenode,store,title) {
	var renderer = new WikiTextRenderer(store,title,this);
	return renderer.render(type,treenode);
};

exports.WikiTextParser = WikiTextParser;

})();
