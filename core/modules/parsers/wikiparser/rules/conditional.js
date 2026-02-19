/*\
title: $:/core/modules/parsers/wikiparser/rules/conditional.js
type: application/javascript
module-type: wikirule
\*/
"use strict";

exports.name = "conditional";
exports.types = {inline: true, block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\<\%\s*if\s+/mg;
	this.terminateIfRegExp = /\%\>/mg;
};

exports.findNextMatch = function(startPos) {
	// Look for the next <%if shortcut
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	// If not found then return no match
	if(!this.match) {
		return undefined;
	}

	this.terminateIfRegExp.lastIndex = this.match.index;
	this.terminateIfMatch = this.terminateIfRegExp.exec(this.parser.source);
	// If not found then return no match
	if(!this.terminateIfMatch) {
		return undefined;
	}

	return this.match.index;
};

exports.parse = function() {
	// Get the filter condition
	var filterCondition = this.parser.source.substring(this.match.index + this.match[0].length,this.terminateIfMatch.index);
	// Advance the parser position to past the %>
	this.parser.pos = this.terminateIfMatch.index + this.terminateIfMatch[0].length;
	// Parse the if clause
	return this.parseIfClause(filterCondition);
};

exports.parseIfClause = function(filterCondition) {
	// Create the list widget
	var listWidget = {
		type: "list",
		tag: "$list",
		isBlock: this.is.block,
		children: [
			{
				type: "list-template",
				tag: "$list-template"
			},
			{
				type: "list-empty",
				tag: "$list-empty"
			}
		]
	};
	$tw.utils.addAttributeToParseTreeNode(listWidget,"filter",filterCondition);
	$tw.utils.addAttributeToParseTreeNode(listWidget,"variable","condition");
	$tw.utils.addAttributeToParseTreeNode(listWidget,"limit","1");
	// Check for an immediately following double linebreak
	var hasLineBreak = !!$tw.utils.parseTokenRegExp(this.parser.source,this.parser.pos,/([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/g);
	// Parse the body looking for else or endif
	var reEndString = "\\<\\%\\s*(endif)\\s*\\%\\>|\\<\\%\\s*(else)\\s*\\%\\>|\\<\\%\\s*(elseif)\\s+([\\s\\S]+?)\\%\\>",
		ex;
	if(hasLineBreak) {
		ex = this.parser.parseBlocksTerminatedExtended(reEndString);
	} else {
		var reEnd = new RegExp(reEndString,"mg");
		ex = this.parser.parseInlineRunTerminatedExtended(reEnd,{eatTerminator: true});
	}

	listWidget.children[0].children = ex.tree;
	// Check for an else or elseif
	if(ex.match) {
		if(ex.match[1] === "endif") {
			// Nothing to do if we just found an endif
		} else if(ex.match[2] === "else") {
			// Check for an immediately following double linebreak
			hasLineBreak = !!$tw.utils.parseTokenRegExp(this.parser.source,this.parser.pos,/([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/g);
			// If we found an else then we need to parse the body looking for the endif
			var reEndString = "\\<\\%\\s*(endif)\\s*\\%\\>",
			ex;
			if(hasLineBreak) {
				ex = this.parser.parseBlocksTerminatedExtended(reEndString);
			} else {
				var reEnd = new RegExp(reEndString,"mg");
				ex = this.parser.parseInlineRunTerminatedExtended(reEnd,{eatTerminator: true});
			}

			listWidget.children[1].children = ex.tree;
		} else if(ex.match[3] === "elseif") {
			// Parse the elseif clause by reusing this parser, passing the new filter condition
			listWidget.children[1].children = this.parseIfClause(ex.match[4]);
		}
	}

	return [listWidget];
};
