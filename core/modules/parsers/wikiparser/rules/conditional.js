/*\
title: $:/core/modules/parsers/wikiparser/rules/conditional.js
type: application/javascript
module-type: wikirule

Conditional shortcut syntax

```
This is a <%if [{something}] %>Elephant<%elseif [{else}] %>Pelican<%else%>Crocodile<%endif%>
```

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
	// Check for the next %>
	this.terminateIfRegExp.lastIndex = this.match.index;
	this.terminateIfMatch = this.terminateIfRegExp.exec(this.parser.source);
	// If not found then return no match
	if(!this.terminateIfMatch) {
		return undefined;
	}
	// Return the position at which the construction was found
	return this.match.index;
};

/*
Parse the most recent match
*/
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
	// Put the body into the list template
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
			// Put the parsed content inside the list empty template
			listWidget.children[1].children = ex.tree;
		} else if(ex.match[3] === "elseif") {
			// Parse the elseif clause by reusing this parser, passing the new filter condition
			listWidget.children[1].children = this.parseIfClause(ex.match[4]);
		}
	}
	// Return the parse tree node
	return [listWidget];
};

exports.serialize = function(tree,serialize) {
	// We always have "if" at the beginning
	var filterCondition = tree.attributes.filter.value;
	var ifClauseText = serialize(tree.children[0].children);
	var result = "<%if " + filterCondition + "%>" + ifClauseText;
	function serializeElseIf(listNode) {
		// We receive the only list node inside list-template node
		if(!listNode || listNode.type !== "list") {
			return "<%else%>" + serialize(listNode);
		}
		var filter = listNode.attributes.filter.value || "";
		var bodyText = serialize(listNode.children[0].children);
		var nextConditionResult = "";
		// May has an only any node inside list-empty node
		if(listNode.children[1] && listNode.children[1].children[0]) {
			if(listNode.children[1].children[0].type === "list") {
				nextConditionResult = serializeElseIf(listNode.children[1].children[0]);
			} else {
				nextConditionResult = "<%else%>" + serialize(listNode.children[1]);
			}
		}
		return "<%elseif " + filter + "%>" + bodyText + nextConditionResult;
	}
	if(tree.children[1] && tree.children[1].children) {
		result += serializeElseIf(tree.children[1].children[0]);
	}
	result += "<%endif%>";
	if(tree.isBlock) {
		result += "\n\n";
	}
	return result;
};
