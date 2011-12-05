/*global require: false, exports: false, process: false */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	TiddlyWiki = require("./TiddlyWiki.js").TiddlyWiki,
	utils = require("./Utils.js"),
	util = require("util");

var textPrimitives = {
	upperLetter: "[A-Z\u00c0-\u00de\u0150\u0170]",
	lowerLetter: "[a-z0-9_\\-\u00df-\u00ff\u0151\u0171]",
	anyLetter:   "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	sliceSeparator: "::",
	sectionSeparator: "##",
	urlPattern: "(?:file|http|https|mailto|ftp|irc|news|data):[^\\s'\"]+(?:/|\\b)",
	unWikiLink: "~",
	brackettedLink: "\\[\\[([^\\]]+)\\]\\]",
	titledBrackettedLink: "\\[\\[([^\\[\\]\\|]+)\\|([^\\[\\]\\|]+)\\]\\]"
};

textPrimitives.wikiLink = "(?:(?:" + textPrimitives.upperLetter + "+" +
							textPrimitives.lowerLetter + "+" +
							textPrimitives.upperLetter +
							textPrimitives.anyLetter + "*)|(?:" +
							textPrimitives.upperLetter + "{2,}" +
							textPrimitives.lowerLetter + "+))";

textPrimitives.cssLookahead = "(?:(" + textPrimitives.anyLetter +
	"+)\\(([^\\)\\|\\n]+)(?:\\):))|(?:(" + textPrimitives.anyLetter + "+):([^;\\|\\n]+);)";

textPrimitives.cssLookaheadRegExp = new RegExp(textPrimitives.cssLookahead,"mg");

textPrimitives.tiddlerForcedLinkRegExp = new RegExp("(?:" + textPrimitives.titledBrackettedLink + ")|(?:" +
	textPrimitives.brackettedLink + ")|(?:" +
	textPrimitives.urlPattern + ")","mg");

textPrimitives.tiddlerAnyLinkRegExp = new RegExp("("+ textPrimitives.wikiLink + ")|(?:" +
	textPrimitives.titledBrackettedLink + ")|(?:" +
	textPrimitives.brackettedLink + ")|(?:" +
	textPrimitives.urlPattern + ")","mg");

function Formatter()
{
	var pattern = [];
	this.formatters = Formatter.formatters;
	for(var n=0; n<this.formatters.length; n++) {
		pattern.push("(" + this.formatters[n].match + ")");
	}
	this.formatterRegExp = new RegExp(pattern.join("|"),"mg");
}

Formatter.createElementAndWikify = function(w) {
	var e = {type: this.element, children: []};
	w.output.push(e);
	w.subWikifyTerm(e.children,this.termRegExp);
};

Formatter.inlineCssHelper = function(w) {
	var styles = [];
	textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
	var lookaheadMatch = textPrimitives.cssLookaheadRegExp.exec(w.source);
	while(lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
		var s,v;
		if(lookaheadMatch[1]) {
			s = lookaheadMatch[1].unDash();
			v = lookaheadMatch[2];
		} else {
			s = lookaheadMatch[3].unDash();
			v = lookaheadMatch[4];
		}
		if(s=="bgcolor")
			s = "backgroundColor";
		if(s=="float")
			s = "cssFloat";
		styles.push({style: s, value: v});
		w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
		textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
		lookaheadMatch = textPrimitives.cssLookaheadRegExp.exec(w.source);
	}
	return styles;
};

Formatter.applyCssHelper = function(e,styles) {
	if(!"attributes" in e) {
		e.attributes = {};
	}
	if(!"styles" in e.attributes) {
		e.attributes.style = {};
	}
	for(var t=0; t< styles.length; t++) {
		e.attributes.style[styles[t].style] = styles[t].value;
	}
};

Formatter.enclosedTextHelper = function(w) {
	this.lookaheadRegExp.lastIndex = w.matchStart;
	var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
	if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
		var text = lookaheadMatch[1];
		w.output.push({type: this.element, children: [
				{type: "text", value: text}
			]});
		w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
	}
};

Formatter.isExternalLink = function(w,link) {
	if(w.store.tiddlerExists(link) || w.store.isShadowTiddler(link)) {
		// Definitely not an external link
		return false;
	}
	var urlRegExp = new RegExp(textPrimitives.urlPattern,"mg");
	if(urlRegExp.exec(link)) {
		// Definitely an external link
		return true;
	}
	if(link.indexOf(".")!=-1 || link.indexOf("\\")!=-1 || link.indexOf("/")!=-1 || link.indexOf("#")!=-1) {
		// Link contains . / \ or # so is probably an external link
		return true;
	}
	// Otherwise assume it is not an external link
	return false;
};

Formatter.formatters = [
{
	name: "table",
	match: "^\\|(?:[^\\n]*)\\|(?:[fhck]?)$",
	lookaheadRegExp: /^\|([^\n]*)\|([fhck]?)$/mg,
	rowTermRegExp: /(\|(?:[fhck]?)$\n?)/mg,
	cellRegExp: /(?:\|([^\n\|]*)\|)|(\|[fhck]?$\n?)/mg,
	cellTermRegExp: /((?:\x20*)\|)/mg,
	rowTypes: {"c":"caption", "h":"thead", "":"tbody", "f":"tfoot"},
	handler: function(w)
	{
		var table = {type: "table", attributes: {className: "twtable"}, children: []};
		w.output.push(table);
		var prevColumns = [];
		var currRowType = null;
		var rowContainer;
		var rowCount = 0;
		w.nextMatch = w.matchStart;
		this.lookaheadRegExp.lastIndex = w.nextMatch;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		while(lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
			var nextRowType = lookaheadMatch[2];
			if(nextRowType == "k") {
				table.attributes.className = lookaheadMatch[1];
				w.nextMatch += lookaheadMatch[0].length+1;
			} else {
				if(nextRowType != currRowType) {
					rowContainer = {type: this.rowTypes[nextRowType], children: [], attributes: {}};
					table.children.push(rowContainer);
					currRowType = nextRowType;
				}
				if(currRowType == "c") {
					// Caption
					w.nextMatch++;
					// Move the caption to the first row if it isn't already
					if(table.children.length !== 1) {
						table.children.pop(); // Take rowContainer out of the children array
						table.splice(0,0,rowContainer); // Insert it at the bottom						
					}
					rowContainer.attributes.align = rowCount === 0 ? "top" : "bottom";
					w.subWikifyTerm(rowContainer.children,this.rowTermRegExp);
				} else {
					var theRow = {type: "tr", className: rowCount%2 ? "oddRow" : "evenRow", children: []};
					rowContainer.children.push(theRow);
					this.rowHandler(w,theRow,prevColumns);
					rowCount++;
				}
			}
			this.lookaheadRegExp.lastIndex = w.nextMatch;
			lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		}
	},
	rowHandler: function(w,e,prevColumns)
	{
		var col = 0;
		var colSpanCount = 1;
		var prevCell = null;
		this.cellRegExp.lastIndex = w.nextMatch;
		var cellMatch = this.cellRegExp.exec(w.source);
		while(cellMatch && cellMatch.index == w.nextMatch) {
			if(cellMatch[1] == "~") {
				// Rowspan
				var last = prevColumns[col];
				if(last) {
					last.rowSpanCount++;
					last.element.attributes.rowspan = last.rowSpanCount;
					last.element.attributes.valign = "center";
					if(colSpanCount > 1) {
						last.element.attributes.colspan = colSpanCount;
						colSpanCount = 1;
					}
				}
				w.nextMatch = this.cellRegExp.lastIndex-1;
			} else if(cellMatch[1] == ">") {
				// Colspan
				colSpanCount++;
				w.nextMatch = this.cellRegExp.lastIndex-1;
			} else if(cellMatch[2]) {
				// End of row
				if(prevCell && colSpanCount > 1) {
					prevCell.attributes.colspan = colSpanCount;
				}
				w.nextMatch = this.cellRegExp.lastIndex;
				break;
			} else {
				// Cell
				w.nextMatch++;
				var styles = Formatter.inlineCssHelper(w);
				var spaceLeft = false;
				var chr = w.source.substr(w.nextMatch,1);
				while(chr == " ") {
					spaceLeft = true;
					w.nextMatch++;
					chr = w.source.substr(w.nextMatch,1);
				}
				var cell;
				if(chr == "!") {
					cell = {type: "th", attributes: {}, children: []};
					e.push(cell);
					w.nextMatch++;
				} else {
					cell = {type: "td", attributes: {}, children: []};
					e.push(cell);
				}
				prevCell = cell;
				prevColumns[col] = {rowSpanCount:1,element:cell};
				if(colSpanCount > 1) {
					cell.attributes.colspan = colSpanCount;
					colSpanCount = 1;
				}
				Formatter.applyCssHelper(cell,styles);
				w.subWikifyTerm(cell,this.cellTermRegExp);
				if(w.matchText.substr(w.matchText.length-2,1) == " ") // spaceRight
					cell.attributes.align = spaceLeft ? "center" : "left";
				else if(spaceLeft)
					cell.attributes.align = "right";
				w.nextMatch--;
			}
			col++;
			this.cellRegExp.lastIndex = w.nextMatch;
			cellMatch = this.cellRegExp.exec(w.source);
		}
	}
},

{
	name: "heading",
	match: "^!{1,6}",
	termRegExp: /(\n)/mg,
	handler: function(w)
	{
		var e = {type: "h" + w.matchLength, attributes: {}, children: []};
		w.output.push(e);
		w.subWikifyTerm(e.children,this.termRegExp);
	}
},

{
	name: "list",
	match: "^(?:[\\*#;:]+)",
	lookaheadRegExp: /^(?:(?:(\*)|(#)|(;)|(:))+)/mg,
	termRegExp: /(\n)/mg,
	handler: function(w)
	{
		var stack = [w.output];
		var currLevel = 0, currType = null;
		var listLevel, listType, itemType, baseType;
		w.nextMatch = w.matchStart;
		this.lookaheadRegExp.lastIndex = w.nextMatch;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		while(lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
			if(lookaheadMatch[1]) {
				listType = "ul";
				itemType = "li";
			} else if(lookaheadMatch[2]) {
				listType = "ol";
				itemType = "li";
			} else if(lookaheadMatch[3]) {
				listType = "dl";
				itemType = "dt";
			} else if(lookaheadMatch[4]) {
				listType = "dl";
				itemType = "dd";
			}
			if(!baseType)
				baseType = listType;
			listLevel = lookaheadMatch[0].length;
			w.nextMatch += lookaheadMatch[0].length;
			var t,e;
			if(listLevel > currLevel) {
				for(t=currLevel; t<listLevel; t++) {
					var target = (currLevel === 0) ? stack[stack.length-1] : stack[stack.length-1].lastChild;
					e = {type: listType, attributes: {}, children: []};
					target.push(e);
					stack.push(e.children);
				}
			} else if(listType!=baseType && listLevel==1) {
				w.nextMatch -= lookaheadMatch[0].length;
				return;
			} else if(listLevel < currLevel) {
				for(t=currLevel; t>listLevel; t--)
					stack.pop();
			} else if(listLevel == currLevel && listType != currType) {
				stack.pop();
				e = {type: listType, attributes: {}, children: []};
				stack[stack.length-1].push(e);
				stack.push(e.children);
			}
			currLevel = listLevel;
			currType = listType;
			e = {type: itemType, attributes: {}, children: []};
			stack[stack.length-1].push(e);
			w.subWikifyTerm(e.children,this.termRegExp);
			this.lookaheadRegExp.lastIndex = w.nextMatch;
			lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		}
	}
},

{
	name: "quoteByBlock",
	match: "^<<<\\n",
	termRegExp: /(^<<<(\n|$))/mg,
	element: "blockquote",
	handler: Formatter.createElementAndWikify
},

{
	name: "quoteByLine",
	match: "^>+",
	lookaheadRegExp: /^>+/mg,
	termRegExp: /(\n)/mg,
	element: "blockquote",
	handler: function(w)
	{
		var stack = [w.output];
		var currLevel = 0;
		var newLevel = w.matchLength;
		var t,matched,e;
		do {
			if(newLevel > currLevel) {
				for(t=currLevel; t<newLevel; t++) {
					e = {type: this.element, attributes: {}, children: []};
					stack[stack.length-1].push(e);
				}
			} else if(newLevel < currLevel) {
				for(t=currLevel; t>newLevel; t--)
					stack.pop();
			}
			currLevel = newLevel;
			w.subWikifyTerm(stack[stack.length-1],this.termRegExp);
			stack[stack.length-1].push({type: "br", attributes: {}});
			this.lookaheadRegExp.lastIndex = w.nextMatch;
			var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			matched = lookaheadMatch && lookaheadMatch.index == w.nextMatch;
			if(matched) {
				newLevel = lookaheadMatch[0].length;
				w.nextMatch += lookaheadMatch[0].length;
			}
		} while(matched);
	}
},

{
	name: "rule",
	match: "^----+$\\n?|<hr ?/?>\\n?",
	handler: function(w)
	{
		var e = {type: "hr", attributes: {}};
		w.output.push(e);
	}
},

{
	name: "monospacedByLine",
	match: "^(?:/\\*\\{\\{\\{\\*/|\\{\\{\\{|//\\{\\{\\{|<!--\\{\\{\\{-->)\\n",
	element: "pre",
	handler: function(w)
	{
		switch(w.matchText) {
		case "/*{{{*/\n": // CSS
			this.lookaheadRegExp = /\/\*\{\{\{\*\/\n*((?:^[^\n]*\n)+?)(\n*^\f*\/\*\}\}\}\*\/$\n?)/mg;
			break;
		case "{{{\n": // monospaced block
			this.lookaheadRegExp = /^\{\{\{\n((?:^[^\n]*\n)+?)(^\f*\}\}\}$\n?)/mg;
			break;
		case "//{{{\n": // plugin
			this.lookaheadRegExp = /^\/\/\{\{\{\n\n*((?:^[^\n]*\n)+?)(\n*^\f*\/\/\}\}\}$\n?)/mg;
			break;
		case "<!--{{{-->\n": //template
			this.lookaheadRegExp = /<!--\{\{\{-->\n*((?:^[^\n]*\n)+?)(\n*^\f*<!--\}\}\}-->$\n?)/mg;
			break;
		default:
			break;
		}
		Formatter.enclosedTextHelper.call(this,w);
	}
},

{
	name: "wikifyComment",
	match: "^(?:/\\*\\*\\*|<!---)\\n",
	handler: function(w)
	{
		var termRegExp = (w.matchText == "/***\n") ? (/(^\*\*\*\/\n)/mg) : (/(^--->\n)/mg);
		w.subWikifyTerm(w.output,termRegExp);
	}
},

{
	name: "macro",
	match: "<<",
	lookaheadRegExp: /<<([^>\s]+)(?:\s*)((?:[^>]|(?:>(?!>)))*)>>/mg,
	handler: function(w)
	{
		this.lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart && lookaheadMatch[1]) {
			w.nextMatch = this.lookaheadRegExp.lastIndex;
			w.output.push({type: "macro", name: lookaheadMatch[1], params: lookaheadMatch[2]});
		}
	}
},

{
	name: "prettyLink",
	match: "\\[\\[",
	lookaheadRegExp: /\[\[(.*?)(?:\|(~)?(.*?))?\]\]/mg,
	handler: function(w)
	{
		this.lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			var e;
			var text = lookaheadMatch[1];
			if(lookaheadMatch[3]) {
				// Pretty bracketted link
				var link = lookaheadMatch[3];
				if(!lookaheadMatch[2] && Formatter.isExternalLink(w,link)) {
					e = {type: "a", href: link, children: []};
				} else {
					e = {type: "tiddlerLink", href: link, children: []};
				}
			} else {
				// Simple bracketted link
				e = {type: "tiddlerLink", href: text, children: []};
			}
			w.output.push(e);
			e.children.push({type: "text", value: text});
			w.nextMatch = this.lookaheadRegExp.lastIndex;
		}
	}
},

{
	name: "wikiLink",
	match: textPrimitives.unWikiLink+"?"+textPrimitives.wikiLink,
	handler: function(w)
	{
		if(w.matchText.substr(0,1) == textPrimitives.unWikiLink) {
			w.outputText(w.output,w.matchStart+1,w.nextMatch);
			return;
		}
		if(w.matchStart > 0) {
			var preRegExp = new RegExp(textPrimitives.anyLetterStrict,"mg");
			preRegExp.lastIndex = w.matchStart-1;
			var preMatch = preRegExp.exec(w.source);
			if(preMatch.index == w.matchStart-1) {
				w.outputText(w.output,w.matchStart,w.nextMatch);
				return;
			}
		}
		if(w.autoLinkWikiWords || w.store.isShadowTiddler(w.matchText)) {
			var link = {type: "tiddlerLink", href: w.matchText, children: []};
			w.output.push(link);
			w.outputText(link.children,w.matchStart,w.nextMatch);
		} else {
			w.outputText(w.output,w.matchStart,w.nextMatch);
		}
	}
},

{
	name: "urlLink",
	match: textPrimitives.urlPattern,
	handler: function(w)
	{
		var e = {type: "a", href: w.matchText, children: []};
		w.output.push(e);
		w.outputText(e.children,w.matchStart,w.nextMatch);
	}
},

{
	name: "image",
	match: "\\[[<>]?[Ii][Mm][Gg]\\[",
	// [<] sequence below is to avoid lessThan-questionMark sequence so TiddlyWikis can be included in PHP files
	lookaheadRegExp: /\[([<]?)(>?)[Ii][Mm][Gg]\[(?:([^\|\]]+)\|)?([^\[\]\|]+)\](?:\[([^\]]*)\])?\]/mg,
	handler: function(w)
	{
		this.lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			var e = w.output;
			if(lookaheadMatch[5]) {
				var link = lookaheadMatch[5],t;
				if(Formatter.isExternalLink(w,link)) {
					t = {type: "a", href: link, attributes: {}, children: []};
					w.output.push(t);
					e = t.children;
				} else {
					t = {type: "tiddlerLink", href: link, attributes: {}, children: []};
					w.output.push(t);
					e = t.children;
				}
				t.attributes.className = "imageLink";
			}
			var img = {type: "img", attributes: {}};
			e.push(img);
			if(lookaheadMatch[1])
				img.attributes.align = "left";
			else if(lookaheadMatch[2])
				img.attributes.align = "right";
			if(lookaheadMatch[3]) {
				img.attributes.title = lookaheadMatch[3];
				img.attributes.alt = lookaheadMatch[3];
			}
			img.src = lookaheadMatch[4];
			w.nextMatch = this.lookaheadRegExp.lastIndex;
		}
	}
},

{
	name: "html",
	match: "<[Hh][Tt][Mm][Ll]>",
	lookaheadRegExp: /<[Hh][Tt][Mm][Ll]>((?:.|\n)*?)<\/[Hh][Tt][Mm][Ll]>/mg,
	handler: function(w)
	{
		this.lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			w.output.push({type: "html", value: lookaheadMatch[1]});
			w.nextMatch = this.lookaheadRegExp.lastIndex;
		}
	}
},

{
	name: "commentByBlock",
	match: "/%",
	lookaheadRegExp: /\/%((?:.|\n)*?)%\//mg,
	handler: function(w)
	{
		this.lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart)
			w.nextMatch = this.lookaheadRegExp.lastIndex;
	}
},

{
	name: "characterFormat",
	match: "''|//|__|\\^\\^|~~|--(?!\\s|$)|\\{\\{\\{",
	handler: function(w)
	{
		var e;
		switch(w.matchText) {
		case "''":
			e = {type: "strong", children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,/('')/mg);
			break;
		case "//":
			e = {type: "em", children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,/(\/\/)/mg);
			break;
		case "__":
			e = {type: "u", children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,/(__)/mg);
			break;
		case "^^":
			e = {type: "sup", children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,/(\^\^)/mg);
			break;
		case "~~":
			e = {type: "sub", children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,/(~~)/mg);
			break;
		case "--":
			e = {type: "strike", children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,/(--)/mg);
			break;
		case "{{{":
			var lookaheadRegExp = /\{\{\{((?:.|\n)*?)\}\}\}/mg;
			lookaheadRegExp.lastIndex = w.matchStart;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				w.output.push({type: "code", children: [
					{type: "text", value: lookaheadMatch[1]}
				]});
				w.nextMatch = lookaheadRegExp.lastIndex;
			}
			break;
		}
	}
},

{
	name: "customFormat",
	match: "@@|\\{\\{",
	handler: function(w)
	{
		switch(w.matchText) {
		case "@@":
			var e = {type: "span", attributes: {}, children: []};
			w.output.push(e);
			var styles = Formatter.inlineCssHelper(w);
			if(styles.length === 0)
				e.className = "marked";
			else
				Formatter.applyCssHelper(e,styles);
			w.subWikifyTerm(e.children,/(@@)/mg);
			break;
		case "{{":
			var lookaheadRegExp = /\{\{[\s]*([\w]+[\s\w]*)[\s]*\{(\n?)/mg;
			lookaheadRegExp.lastIndex = w.matchStart;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			if(lookaheadMatch) {
				w.nextMatch = lookaheadRegExp.lastIndex;
				e = {type: lookaheadMatch[2] == "\n" ? "div" : "span", children: [
					{type: "text", value: lookaheadMatch[1]}
				]};
				w.output.push(e);
				w.subWikifyTerm(e.children,/(\}\}\})/mg);
			}
			break;
		}
	}
},

{
	name: "mdash",
	match: "--",
	handler: function(w)
	{
		w.output.push({type: "text", value: "&mdash;"});
	}
},

{
	name: "lineBreak",
	match: "\\n|<br ?/?>",
	handler: function(w)
	{
		w.output.push({type: "br"});
	}
},

{
	name: "rawText",
	match: "\"{3}|<nowiki>",
	lookaheadRegExp: /(?:\"{3}|<nowiki>)((?:.|\n)*?)(?:\"{3}|<\/nowiki>)/mg,
	handler: function(w)
	{
		this.lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			w.output.push({type: "text", value: lookaheadMatch[1]});
			w.nextMatch = this.lookaheadRegExp.lastIndex;
		}
	}
},

{
	name: "htmlEntitiesEncoding",
	match: "(?:(?:&#?[a-zA-Z0-9]{2,8};|.)(?:&#?(?:x0*(?:3[0-6][0-9a-fA-F]|1D[c-fC-F][0-9a-fA-F]|20[d-fD-F][0-9a-fA-F]|FE2[0-9a-fA-F])|0*(?:76[89]|7[7-9][0-9]|8[0-7][0-9]|761[6-9]|76[2-7][0-9]|84[0-3][0-9]|844[0-7]|6505[6-9]|6506[0-9]|6507[0-1]));)+|&#?[a-zA-Z0-9]{2,8};)",
	handler: function(w)
	{
		w.output.push({type: "text", value: w.matchText});
	}
}

];

exports.Formatter = Formatter;
