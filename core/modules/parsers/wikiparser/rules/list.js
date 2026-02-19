/*\
title: $:/core/modules/parsers/wikiparser/rules/list.js
type: application/javascript
module-type: wikirule
\*/

"use strict";

exports.name = "list";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /([\*#;:>]+)/mg;
};

var listTypes = {
	"*": {listTag: "ul", itemTag: "li"},
	"#": {listTag: "ol", itemTag: "li"},
	";": {listTag: "dl", itemTag: "dt"},
	":": {listTag: "dl", itemTag: "dd"},
	">": {listTag: "blockquote", itemTag: "div"}
};
exports.listTypes = listTypes;

exports.parse = function() {
	// Array of parse tree nodes for the previous row of the list
	var listStack = [];
	// Cycle through the items in the list
	while(true) {
		// Match the list marker
		var reMatch = /([\*#;:>]+)/mg;
		reMatch.lastIndex = this.parser.pos;
		var start = this.parser.pos;
		var match = reMatch.exec(this.parser.source);
		if(!match || match.index !== this.parser.pos) {
			break;
		}

		var listInfo = listTypes[match[0].charAt(0)];
		if(listStack.length > 0 && listStack[0].tag !== listInfo.listTag) {
			break;
		}

		this.parser.pos = match.index + match[0].length;
		// Walk through the list markers for the current row
		for(var t=0; t<match[0].length; t++) {
			listInfo = listTypes[match[0].charAt(t)];
			// Remove any stacked up element if we can't re-use it because the list type doesn't match
			if(listStack.length > t && listStack[t].tag !== listInfo.listTag) {
				listStack.splice(t,listStack.length - t);
			}

			if(listStack.length <= t) {
				var listElement = {
					type: "element",
					tag: listInfo.listTag,
					children: [
						{
							type: "element",
							tag: listInfo.itemTag,
							children: [],
							start: start,
							end: this.parser.pos,
						}
					],
					start: start,
					end: this.parser.pos,
				};
				// Link this list element into the last child item of the parent list item
				if(t) {
					var prevListItem = listStack[t-1].children[listStack[t-1].children.length-1];
					prevListItem.children.push(listElement);
				}

				listStack[t] = listElement;
			} else if(t === (match[0].length - 1)) {
				listStack[t].children.push({
					type: "element",
					tag: listInfo.itemTag,
					children: [],
					start: start,
					end: this.parser.pos,
				});
			}
		}
		if(listStack.length > match[0].length) {
			listStack.splice(match[0].length,listStack.length - match[0].length);
		}

		var classStart = this.parser.pos;
		var lastListChildren = listStack[listStack.length-1].children,
			lastListItem = lastListChildren[lastListChildren.length-1],
			classes = this.parser.parseClasses();
		var classEnd = this.parser.pos;
		this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
		var tree = this.parser.parseInlineRun(/(\r?\n)/mg);
		lastListItem.children.push.apply(lastListItem.children,tree);
		lastListItem.end = this.parser.pos;
		listStack[listStack.length-1].end = this.parser.pos;
		if(classes.length > 0) {
			$tw.utils.addClassToParseTreeNode(lastListItem,classes.join(" "));
			lastListItem.attributes.class.start = classStart;
			lastListItem.attributes.class.end = classEnd;
		}

		this.parser.skipWhitespace();
	}

	return [listStack[0]];
};
