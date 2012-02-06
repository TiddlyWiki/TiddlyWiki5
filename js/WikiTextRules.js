/*\
title: js/WikiTextRules.js

\*/
(function(){

/*jslint node: true */
"use strict";

var ArgParser = require("./ArgParser.js").ArgParser,
	HTML = require("./HTML.js").HTML,
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

// Helper to add an attribute to an HTML node
var setAttr = function(node,attr,value) {
	if(!node.attributes) {
		node.attributes = {};
	}
	node.attributes[attr] = value;
};

var inlineCssHelper = function(w) {
	var styles = [];
	textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
	var lookaheadMatch = textPrimitives.cssLookaheadRegExp.exec(w.source);
	while(lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
		var s,v;
		if(lookaheadMatch[1]) {
			s = lookaheadMatch[1];
			v = lookaheadMatch[2];
		} else {
			s = lookaheadMatch[3];
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

var applyCssHelper = function(e,styles) {
	if(styles.length > 0) {
		if(!e.attributes) {
			e.attributes = {};
		}
		if(!e.attributes.style) {
			e.attributes.style = {};
		}
		for(var t=0; t< styles.length; t++) {
			e.attributes.style[styles[t].style] = styles[t].value;
		}
	}
};

var enclosedTextHelper = function(w) {
	this.lookaheadRegExp.lastIndex = w.matchStart;
	var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
	if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
		var text = lookaheadMatch[1];
		w.output.push(HTML.elem(this.element,null,[HTML.text(text)]));
		w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
	}
};

var parseMacroCall = function(w,name,paramString) {
	var macro = w.store.macros[name],
		params = {},
		dependencies = [];
	if(macro) {
		if(macro.dependentAll) {
			dependencies = null;
		}
		var args = new ArgParser(paramString,{defaultName: "anon"}),
			insertParam = function(param,name,arg) {
				if(param.dependentAll) {
					dependencies = null;
				}
				if(param.type === "tiddler") {
					if(arg.evaluated) {
						dependencies = null;
					} else if(dependencies !== null) {
						dependencies.push(arg.string);
					}
				}
				params[name] = {type: arg.evaluated ? "eval" : "string", value: arg.string};
			};
		for(var m in macro.params) {
			var param = macro.params[m],
				arg;
			if("byPos" in param && args.byPos[param.byPos]) {
				arg = args.byPos[param.byPos].v;
				insertParam(param,m,arg);
			} else if("byName" in param) {
				arg = args.getValueByName(m);
				if(!arg && param.byName === "default") {
					arg = args.getValueByName("anon");
				}
				if(arg) {
					insertParam(param,m,arg);
				}
			}
		}
	}
	w.addDependencies(dependencies);
	return {type: "macro", name: name, params: params, dependencies: dependencies};
};

var rules = [
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
		var table = HTML.elem("table",{"class": "twtable"},[]);
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
				table.attributes["class"] = lookaheadMatch[1];
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
						table.children.splice(0,0,rowContainer); // Insert it at the bottom						
					}
					rowContainer.attributes.align = rowCount === 0 ? "top" : "bottom";
					w.subWikifyTerm(rowContainer.children,this.rowTermRegExp);
				} else {
					var theRow = HTML.elem("tr",{},[]);
					theRow.attributes["class"] = rowCount%2 ? "oddRow" : "evenRow";
					rowContainer.children.push(theRow);
					this.rowHandler(w,theRow.children,prevColumns);
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
				var styles = inlineCssHelper(w);
				var spaceLeft = false;
				var chr = w.source.substr(w.nextMatch,1);
				while(chr == " ") {
					spaceLeft = true;
					w.nextMatch++;
					chr = w.source.substr(w.nextMatch,1);
				}
				var cell;
				if(chr == "!") {
					cell = HTML.elem("th",{},[]);
					e.push(cell);
					w.nextMatch++;
				} else {
					cell = HTML.elem("td",{},[]);
					e.push(cell);
				}
				prevCell = cell;
				prevColumns[col] = {rowSpanCount:1,element:cell};
				if(colSpanCount > 1) {
					cell.attributes.colspan = colSpanCount;
					colSpanCount = 1;
				}
				applyCssHelper(cell,styles);
				w.subWikifyTerm(cell.children,this.cellTermRegExp);
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
		var e = {type: "h" + w.matchLength, children: []};
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
					var target = stack[stack.length-1];
					if(currLevel !== 0 && target.children) {
						target = target.children[target.children.length-1];
					}
					e = {type: listType, children: []};
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
				e = {type: listType, children: []};
				stack[stack.length-1].push(e);
				stack.push(e.children);
			}
			currLevel = listLevel;
			currType = listType;
			e = {type: itemType, children: []};
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
	handler:  function(w) {
		var e = {type: this.element, children: []};
		w.output.push(e);
		w.subWikifyTerm(e.children,this.termRegExp);
	}
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
			stack[stack.length-1].push({type: "br"});
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
		var e = {type: "hr"};
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
		enclosedTextHelper.call(this,w);
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
			w.output.push(parseMacroCall(w,lookaheadMatch[1],lookaheadMatch[2]));
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
			var e = {type: "macro", name: "link", params: {
					target: {type: "string", value: null}
				},
				children: [{
					type: "text",
					value: ""
				}],
				dependencies: []},
				text = lookaheadMatch[1];
			if(lookaheadMatch[3]) {
				// Pretty bracketted link
				var link = lookaheadMatch[3];
				e.params.target.value = link;
				e.dependencies.push(link);
				w.addDependency(link);
			} else {
				// Simple bracketted link
				e.params.target.value = text;
				e.dependencies.push(text);
				w.addDependency(text);
			}
			e.children[0].value = text;
			w.output.push(e);
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
		if(w.autoLinkWikiWords) {
			var link = {type: "macro", name: "link", params: {
							target: {type: "string", value: w.matchText}
						},
						children: [{
							type: "text",
							value: w.source.substring(w.matchStart,w.nextMatch)
						}],
						dependencies: [
							w.matchText
						]};
			w.addDependency(w.matchText);
			w.output.push(link);
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
		var e = {type: "macro", name: "link", params: {
					target: {type: "string", value: w.matchText}
				},
				children: [{
					type: "text",
					value: w.source.substring(w.matchStart,w.nextMatch)
				}],
				dependencies: [
					w.matchText
				]};
		w.addDependency(w.matchText);
		w.output.push(e);
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
		var lookaheadMatch = this.lookaheadRegExp.exec(w.source),
			image = {type: "macro", name: "image", params: {
				src: {type: "string", value: ""}
			}},
			link = {type: "macro", name: "link", params: {
				target: {type: "string", value: ""}
			}, children: [image]};
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			if(lookaheadMatch[1]) {
				image.params.alignment = {type: "string", value: "left"};
			} else if(lookaheadMatch[2]) {
				image.params.alignment = {type: "string", value: "right"};
			}
			if(lookaheadMatch[3]) {
				image.params.text = {type: "string", value: lookaheadMatch[3]};
			}
			image.params.src.value = lookaheadMatch[4];
			image.dependencies = [lookaheadMatch[4]];
			if(lookaheadMatch[5]) {
				link.params.target.value = lookaheadMatch[5];
				link.dependencies = [lookaheadMatch[5]];
				w.output.push(link);
			} else {
				w.output.push(image);
			}
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
	match: "''|//|__|\\^\\^|~~|--(?!\\s|$)|\\{\\{\\{|`",
	handler: function(w)
	{
		var e,lookaheadRegExp,lookaheadMatch;
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
		case "`":
			lookaheadRegExp = /`((?:.|\n)*?)`/mg;
			lookaheadRegExp.lastIndex = w.matchStart;
			lookaheadMatch = lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				w.output.push({type: "code", children: [
					{type: "text", value: lookaheadMatch[1]}
				]});
				w.nextMatch = lookaheadRegExp.lastIndex;
			}
			break;
		case "{{{":
			lookaheadRegExp = /\{\{\{((?:.|\n)*?)\}\}\}/mg;
			lookaheadRegExp.lastIndex = w.matchStart;
			lookaheadMatch = lookaheadRegExp.exec(w.source);
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
			var e = {type: "span", children: []};
			w.output.push(e);
			var styles = inlineCssHelper(w);
			if(styles.length === 0)
				setAttr(e,"class","marked");
			else
				applyCssHelper(e,styles);
			w.subWikifyTerm(e.children,/(@@)/mg);
			break;
		case "{{":
			var lookaheadRegExp = /\{\{[\s]*([\w]+[\s\w]*)[\s]*\{(\n?)/mg;
			lookaheadRegExp.lastIndex = w.matchStart;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			if(lookaheadMatch) {
				w.nextMatch = lookaheadRegExp.lastIndex;
				e = {type: lookaheadMatch[2] == "\n" ? "div" : "span", children: []};
				setAttr(e,"class",lookaheadMatch[1]);
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
	match: "&#?[a-zA-Z0-9]{2,8};",
	handler: function(w)
	{
		w.output.push({type: "entity", value: w.matchText});
	}
}

];

exports.rules = rules;

})();
