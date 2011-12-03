/*

Wikifier for TiddlyWiki format text

The wikifier parses wikitext into an intermediate tree from which the HTML is generated.

HTML elements are stored in the tree like this:

	{type: "div", attributes: {
			attr1: value,
			attr2: value
		}, children: [
			{child},
			{child},		
	]}

Text nodes are:

	{type: "text", value: "string of text node"}

*/

/*global require: false, exports: false, process: false */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	TiddlyWiki = require("./TiddlyWiki.js").TiddlyWiki,
	utils = require("./Utils.js"),
	util = require("util");

// Construct a wikifier object around a Formatter() object
var Wikifier = function(formatter) {
	this.formatter = formatter;
	this.autoLinkWikiWords = true;
};

// Wikify a string as if it were from a particular tiddler and return it as an HTML string
Wikifier.prototype.wikify = function(source,tiddler) {
	this.source = source;
	this.nextMatch = 0;
	this.tiddler = tiddler;
	this.tree = [];
	this.output = null;
	this.subWikify(this.tree);
	return this.tree; // Just return the tree for now
};

// Wikify a string as if it were from a particular tiddler and return it as plain text
Wikifier.prototype.wikifyPlain = function(source,tiddler) {
	this.source = source;
	this.nextMatch = 0;
	this.tiddler = tiddler;
	this.tree = [];
	this.output = null;
	this.subWikify(this.tree);
	var resultText = [],
		extractText = function(tree) {
			for(var t=0; t<tree.length; t++) {
				var node = tree[t];
				if(node.type === "text") {
					resultText.push(node.value);
				} else if(node.children) {
					extractText(node.children);
				}
			}
		};
	extractText(this.tree);
	return resultText.join("");
};

Wikifier.prototype.outputText = function(place,startPos,endPos)
{
	if(startPos < endPos) {
		place.push({type: "text", value: this.source.substring(startPos,endPos)});
	}
};

Wikifier.prototype.subWikify = function(output,terminator)
{
	// Handle the terminated and unterminated cases separately, this speeds up wikifikation by about 30%
	try {
		if(terminator)
			this.subWikifyTerm(output,new RegExp("(" + terminator + ")","mg"));
		else
			this.subWikifyUnterm(output);
	} catch(ex) {
		showException(ex);
	}
};

Wikifier.prototype.subWikifyUnterm = function(output)
{
	// subWikify can be indirectly recursive, so we need to save the old output pointer
	var oldOutput = this.output;
	this.output = output;
	// Get the first match
	this.formatter.formatterRegExp.lastIndex = this.nextMatch;
	var formatterMatch = this.formatter.formatterRegExp.exec(this.source);
	while(formatterMatch) {
		// Output any text before the match
		if(formatterMatch.index > this.nextMatch)
			this.outputText(this.output,this.nextMatch,formatterMatch.index);
		// Set the match parameters for the handler
		this.matchStart = formatterMatch.index;
		this.matchLength = formatterMatch[0].length;
		this.matchText = formatterMatch[0];
		this.nextMatch = this.formatter.formatterRegExp.lastIndex;
		// Figure out which formatter matched and call its handler
		var t;
		for(t=1; t<formatterMatch.length; t++) {
			if(formatterMatch[t]) {
				this.formatter.formatters[t-1].handler(this);
				this.formatter.formatterRegExp.lastIndex = this.nextMatch;
				break;
			}
		}
		// Get the next match
		formatterMatch = this.formatter.formatterRegExp.exec(this.source);
	}
	// Output any text after the last match
	if(this.nextMatch < this.source.length) {
		this.outputText(this.output,this.nextMatch,this.source.length);
		this.nextMatch = this.source.length;
	}
	// Restore the output pointer
	this.output = oldOutput;
};

Wikifier.prototype.subWikifyTerm = function(output,terminatorRegExp)
{
	// subWikify can be indirectly recursive, so we need to save the old output pointer
	var oldOutput = this.output;
	this.output = output;
	// Get the first matches for the formatter and terminator RegExps
	terminatorRegExp.lastIndex = this.nextMatch;
	var terminatorMatch = terminatorRegExp.exec(this.source);
	this.formatter.formatterRegExp.lastIndex = this.nextMatch;
	var formatterMatch = this.formatter.formatterRegExp.exec(terminatorMatch ? this.source.substr(0,terminatorMatch.index) : this.source);
	while(terminatorMatch || formatterMatch) {
		// Check for a terminator match before the next formatter match
		if(terminatorMatch && (!formatterMatch || terminatorMatch.index <= formatterMatch.index)) {
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
		// It must be a formatter match; output any text before the match
		if(formatterMatch.index > this.nextMatch)
			this.outputText(this.output,this.nextMatch,formatterMatch.index);
		// Set the match parameters
		this.matchStart = formatterMatch.index;
		this.matchLength = formatterMatch[0].length;
		this.matchText = formatterMatch[0];
		this.nextMatch = this.formatter.formatterRegExp.lastIndex;
		// Figure out which formatter matched and call its handler
		var t;
		for(t=1; t<formatterMatch.length; t++) {
			if(formatterMatch[t]) {
				this.formatter.formatters[t-1].handler(this);
				this.formatter.formatterRegExp.lastIndex = this.nextMatch;
				break;
			}
		}
		// Get the next match
		terminatorRegExp.lastIndex = this.nextMatch;
		terminatorMatch = terminatorRegExp.exec(this.source);
		formatterMatch = this.formatter.formatterRegExp.exec(terminatorMatch ? this.source.substr(0,terminatorMatch.index) : this.source);
	}
	// Output any text after the last match
	if(this.nextMatch < this.source.length) {
		this.outputText(this.output,this.nextMatch,this.source.length);
		this.nextMatch = this.source.length;
	}
	// Restore the output pointer
	this.output = oldOutput;
};

exports.Wikifier = Wikifier;
