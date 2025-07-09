/*\
title: $:/plugins/tiddlywiki/tw2parser/wikitextrules.js
type: application/javascript
module-type: module

Rule modules for the wikitext parser

\*/

"use strict";
const macroadapter = require("$:/macros/classic/macroadapter.js");
const textPrimitives = {
	upperLetter: "[A-Z\u00c0-\u00de\u0150\u0170]",
	lowerLetter: "[a-z0-9_\\-\u00df-\u00ff\u0151\u0171]",
	anyLetter: "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	sliceSeparator: "::",
	sectionSeparator: "##",
	urlPattern: String.raw`(?:file|http|https|mailto|ftp|irc|news|data):[^\s'"]+(?:/|\b)`,
	unWikiLink: "~",
	brackettedLink: String.raw`\[\[([^\]]+)\]\]`,
	titledBrackettedLink: String.raw`\[\[([^\[\]\|]+)\|([^\[\]\|]+)\]\]`
};

textPrimitives.wikiLink = `(?:(?:${textPrimitives.upperLetter}+${textPrimitives.lowerLetter}+${textPrimitives.upperLetter
	}${textPrimitives.anyLetter}*)|(?:${textPrimitives.upperLetter}{2,}${textPrimitives.lowerLetter}+))`;

textPrimitives.cssLookahead = `(?:(${textPrimitives.anyLetter
	}+)\\(([^\\)\\|\\n]+)(?:\\):))|(?:(${textPrimitives.anyLetter}+):([^;\\|\\n]+);)`;

textPrimitives.cssLookaheadRegExp = new RegExp(textPrimitives.cssLookahead,"mg");

textPrimitives.tiddlerForcedLinkRegExp = new RegExp(`(?:${textPrimitives.titledBrackettedLink})|(?:${textPrimitives.brackettedLink})|(?:${textPrimitives.urlPattern})`,"mg");

textPrimitives.tiddlerAnyLinkRegExp = new RegExp(`(${textPrimitives.wikiLink})|(?:${textPrimitives.titledBrackettedLink})|(?:${textPrimitives.brackettedLink})|(?:${textPrimitives.urlPattern})`,"mg");

// Helper to add an attribute to an HTML node
const setAttr = function(node,attr,value) {
	if(!node.attributes) {
		node.attributes = {};
	}
	node.attributes[attr] = {type: "string",value};
};

const inlineCssHelper = function(w) {
	const styles = [];
	textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
	let lookaheadMatch = textPrimitives.cssLookaheadRegExp.exec(w.source);
	while(lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
		var s; var v;
		if(lookaheadMatch[1]) {
			s = lookaheadMatch[1];
			v = lookaheadMatch[2];
		} else {
			s = lookaheadMatch[3];
			v = lookaheadMatch[4];
		}
		if(s == "bgcolor")
			s = "backgroundColor";
		if(s == "float")
			s = "cssFloat";
		styles.push({style: s,value: v});
		w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
		textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
		lookaheadMatch = textPrimitives.cssLookaheadRegExp.exec(w.source);
	}
	return styles;
};

const applyCssHelper = function(e,styles) {

	if(styles.length > 0) {

		for(let t = 0;t < styles.length;t++) {
			$tw.utils.addStyleToParseTreeNode(e,$tw.utils.roundTripPropertyName(styles[t].style),styles[t].value);
		}
	}

};

const enclosedTextHelper = function(w) {
	this.lookaheadRegExp.lastIndex = w.matchStart;
	const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
	if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
		const text = lookaheadMatch[1];
		w.output.push({
			type: "element",tag: this.element,
			children: [{type: "text",text: lookaheadMatch[1]}]
		});
		w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
	}
};

const insertMacroCall = function(w,output,macroName,paramString) {
	const params = [];
	const reParam = /\s*(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))/mg;
	let paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Process this parameter
		const paramInfo = {
			value: paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5] || paramMatch[6]
		};
		if(paramMatch[1]) {
			paramInfo.name = paramMatch[1];
		}
		params.push(paramInfo);
		// Find the next match
		paramMatch = reParam.exec(paramString);
	}
	output.push({
		type: "macrocall",
		name: macroName,
		params,
		isBlock: false
	});
};


const isLinkExternal = function(to) {
	const externalRegExp = /(?:file|http|https|mailto|ftp|irc|news|obsidian|data|skype):[^\s'"]+(?:\/|\b)/i;
	return externalRegExp.test(to);
};
const rules = [
	{
		name: "table",
		match: String.raw`^\|(?:[^\n]*)\|(?:[fhck]?)$`,
		lookaheadRegExp: /^\|([^\n]*)\|([fhck]?)$/mg,
		rowTermRegExp: /(\|(?:[fhck]?)$\n?)/mg,
		cellRegExp: /(?:\|([^\n\|]*)\|)|(\|[fhck]?$\n?)/mg,
		cellTermRegExp: /((?:\x20*)\|)/mg,
		rowTypes: {"c": "caption","h": "thead","": "tbody","f": "tfoot"},
		handler(w) {
			const table = {
				type: "element",tag: "table",attributes: {"class": {type: "string",value: "table"}},
				children: []
			};

			w.output.push(table);
			const prevColumns = [];
			let currRowType = null;
			let rowContainer;
			let rowCount = 0;
			w.nextMatch = w.matchStart;
			this.lookaheadRegExp.lastIndex = w.nextMatch;
			let lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			while(lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
				const nextRowType = lookaheadMatch[2];
				if(nextRowType == "k") {
					table.attributes["class"] = lookaheadMatch[1];
					w.nextMatch += lookaheadMatch[0].length + 1;
				} else {
					if(nextRowType != currRowType) {
						rowContainer = {type: "element",tag: this.rowTypes[nextRowType],children: []};
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
						rowContainer.attributes = {};
						rowContainer.attributes.align = rowCount === 0 ? "top" : "bottom";
						w.subWikifyTerm(rowContainer.children,this.rowTermRegExp);
					} else {
						const theRow = {
							type: "element",tag: "tr",
							attributes: {"class": {type: "string",value: rowCount % 2 ? "oddRow" : "evenRow"}},
							children: []
						};

						rowContainer.children.push(theRow);
						this.rowHandler(w,theRow.children,prevColumns);
						rowCount++;
					}
				}
				this.lookaheadRegExp.lastIndex = w.nextMatch;
				lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			}
		},
		rowHandler(w,e,prevColumns) {
			let col = 0;
			let colSpanCount = 1;
			let prevCell = null;
			this.cellRegExp.lastIndex = w.nextMatch;
			let cellMatch = this.cellRegExp.exec(w.source);
			while(cellMatch && cellMatch.index == w.nextMatch) {
				if(cellMatch[1] == "~") {
					// Rowspan
					const last = prevColumns[col];
					if(last) {
						last.rowSpanCount++;
						$tw.utils.addAttributeToParseTreeNode(last.element,"rowspan",last.rowSpanCount);
						const vAlign = $tw.utils.getAttributeValueFromParseTreeNode(last.element,"valign","center");
						$tw.utils.addAttributeToParseTreeNode(last.element,"valign",vAlign);
						if(colSpanCount > 1) {
							$tw.utils.addAttributeToParseTreeNode(last.element,"colspan",colSpanCount);
							colSpanCount = 1;
						}
					}
					w.nextMatch = this.cellRegExp.lastIndex - 1;
				} else if(cellMatch[1] == ">") {
					// Colspan
					colSpanCount++;
					w.nextMatch = this.cellRegExp.lastIndex - 1;
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
					const styles = inlineCssHelper(w);
					let spaceLeft = false;
					let chr = w.source.substr(w.nextMatch,1);
					while(chr == " ") {
						spaceLeft = true;
						w.nextMatch++;
						chr = w.source.substr(w.nextMatch,1);
					}
					var cell;
					if(chr == "!") {
						cell = {type: "element",tag: "th",children: []};
						e.push(cell);
						w.nextMatch++;
					} else {
						cell = {type: "element",tag: "td",children: []};
						e.push(cell);
					}
					prevCell = cell;
					prevColumns[col] = {rowSpanCount: 1,element: cell};
					if(colSpanCount > 1) {
						$tw.utils.addAttributeToParseTreeNode(cell,"colspan",colSpanCount);
						colSpanCount = 1;
					}
					applyCssHelper(cell,styles);
					w.subWikifyTerm(cell.children,this.cellTermRegExp);
					if(!cell.attributes) cell.attributes = {};
					if(w.matchText.substr(w.matchText.length - 2,1) == " ") // spaceRight
						$tw.utils.addAttributeToParseTreeNode(cell,"align",spaceLeft ? "center" : "left");
					else if(spaceLeft)
						$tw.utils.addAttributeToParseTreeNode(cell,"align","right");
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
		handler(w) {
			const e = {type: "element",tag: `h${w.matchLength}`,children: []};
			w.output.push(e);
			w.subWikifyTerm(e.children,this.termRegExp);
		}
	},

	{
		name: "list",
		match: String.raw`^(?:[\*#;:]+)`,
		lookaheadRegExp: /^(?:(?:(\*)|(#)|(;)|(:))+)/mg,
		termRegExp: /(\n)/mg,
		handler(w) {
			const stack = [w.output];
			let currLevel = 0; let currType = null;
			let listLevel; let listType; let itemType; let baseType;
			w.nextMatch = w.matchStart;
			this.lookaheadRegExp.lastIndex = w.nextMatch;
			let lookaheadMatch = this.lookaheadRegExp.exec(w.source);
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
				var t; var e;
				if(listLevel > currLevel) {
					for(t = currLevel;t < listLevel;t++) {
						let target = stack[stack.length - 1];
						if(currLevel !== 0 && target.children) {
							target = target.children[target.children.length - 1];
						}
						e = {type: "element",tag: listType,children: []};
						target.push(e);
						stack.push(e.children);
					}
				} else if(listType != baseType && listLevel == 1) {
					w.nextMatch -= lookaheadMatch[0].length;
					return;
				} else if(listLevel < currLevel) {
					for(t = currLevel;t > listLevel;t--)
						stack.pop();
				} else if(listLevel == currLevel && listType != currType) {
					stack.pop();
					e = {type: "element",tag: listType,children: []};
					stack[stack.length - 1].push(e);
					stack.push(e.children);
				}
				currLevel = listLevel;
				currType = listType;
				e = {type: "element",tag: itemType,children: []};
				stack[stack.length - 1].push(e);
				w.subWikifyTerm(e.children,this.termRegExp);
				this.lookaheadRegExp.lastIndex = w.nextMatch;
				lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			}
		}
	},

	{
		name: "quoteByBlock",
		match: String.raw`^<<<\n`,
		termRegExp: /(^<<<(\n|$))/mg,
		element: "blockquote",
		handler(w) {
			const e = {type: "element",tag: this.element,children: []};
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
		handler(w) {
			const stack = [];
			let currLevel = 0;
			let newLevel = w.matchLength;
			let t; let matched; let e;
			do {
				if(newLevel > currLevel) {
					for(t = currLevel;t < newLevel;t++) {
						const f = stack[stack.length - 1];
						e = {type: "element",tag: this.element,children: []};
						stack.push(e);
						if(t === 0) {
							w.output.push(e);
						} else {
							f.children.push(e);

						}
					}
				} else if(newLevel < currLevel) {
					for(t = currLevel;t > newLevel;t--)
						stack.pop();
				}
				currLevel = newLevel;
				w.subWikifyTerm(stack[stack.length - 1].children,this.termRegExp);
				stack[stack.length - 1].children.push({type: "element",tag: "br"});
				//e.push({type:"element",tag:"br"});

				this.lookaheadRegExp.lastIndex = w.nextMatch;
				const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
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
		match: String.raw`^----+$\n?|<hr ?/?>\n?`,
		handler(w) {
			w.output.push({type: "element",tag: "hr"});
		}
	},

	{
		name: "monospacedByLine",
		match: String.raw`^(?:/\*\{\{\{\*/|\{\{\{|//\{\{\{|<!--\{\{\{-->)\n`,
		element: "pre",
		handler(w) {
			switch(w.matchText) {
				case "/*{{{*/\n": { // CSS
					this.lookaheadRegExp = /\/\*\{\{\{\*\/\n*((?:^[^\n]*\n)+?)(\n*^\f*\/\*\}\}\}\*\/$\n?)/mg;
					break;
				}
				case "{{{\n": { // monospaced block
					this.lookaheadRegExp = /^\{\{\{\n((?:^[^\n]*\n)+?)(^\f*\}\}\}$\n?)/mg;
					break;
				}
				case "//{{{\n": { // plugin
					this.lookaheadRegExp = /^\/\/\{\{\{\n\n*((?:^[^\n]*\n)+?)(\n*^\f*\/\/\}\}\}$\n?)/mg;
					break;
				}
				case "<!--{{{-->\n": { //template
					this.lookaheadRegExp = /<!--\{\{\{-->\n*((?:^[^\n]*\n)+?)(\n*^\f*<!--\}\}\}-->$\n?)/mg;
					break;
				}
				default: {
					break;
				}
			}
			enclosedTextHelper.call(this,w);
		}
	},

	{
		name: "typedBlock",
		match: String.raw`^\$\$\$(?:[^ >\r\n]*)\r?\n`,
		lookaheadRegExp: /^\$\$\$([^ >\r\n]*)\n((?:^[^\n]*\r?\n)+?)(^\f*\$\$\$\r?\n?)/mg,
		//match: "^\\$\\$\\$(?:[^ >\\r\\n]*)(?: *> *([^ \\r\\n]+))?\\r?\\n",
		//lookaheadRegExp: /^\$\$\$([^ >\r\n]*)(?: *> *([^ \r\n]+))\n((?:^[^\n]*\n)+?)(^\f*\$\$\$$\n?)/mg,
		handler(w) {
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				// The wikitext parsing infrastructure is horribly unre-entrant
				const parseType = lookaheadMatch[1];
				let renderType; const //= this.match[2],
					text = lookaheadMatch[2];
				const oldOutput = w.output;
				const oldSource = w.source;
				const oldNextMatch = w.nextMatch;
				const oldChildren = w.children;
				// Parse the block according to the specified type
				const parser = $tw.wiki.parseText(parseType,text.toString(),{defaultType: "text/plain"});

				w.output = oldOutput;
				w.source = oldSource;
				w.nextMatch = oldNextMatch;
				w.children = oldChildren;
				for(let i = 0;i < parser.tree.length;i++) {
					w.output.push(parser.tree[i]);
				}
				w.nextMatch = this.lookaheadRegExp.lastIndex;
			}
		}
	},

	{
		name: "wikifyComment",
		match: String.raw`^(?:/\*\*\*|<!---)\n`,
		handler(w) {
			const termRegExp = (w.matchText == "/***\n") ? (/(^\*\*\*\/\n)/mg) : (/(^--->\n)/mg);
			w.subWikifyTerm(w.output,termRegExp);
		}
	},

	{
		name: "macro",
		match: "<<",
		lookaheadRegExp: /<<(?:([!@£\$%\^\&\*\(\)`\~'"\|\\\/;\:\.\,\+\=\-\_\{\}])|([^>\s]+))(?:\s*)((?:[^>]|(?:>(?!>)))*)>>/mg,
		handler(w) {
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			let name;
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				name = lookaheadMatch[1] || lookaheadMatch[2];
				let params = lookaheadMatch[3]; const nameold = name;
				if(name) {
					if(macroadapter.paramadapter[name]) {
						params = macroadapter.paramadapter[name](params);
						//alert("going out as "+params);
					}
					if(macroadapter.namedapter[name]) {
						name = macroadapter.namedapter[name];
					}
					w.nextMatch = this.lookaheadRegExp.lastIndex;
					insertMacroCall(w,w.output,name,params);
				}
			}
		}
	},


	{
		name: "prettyLink",
		match: String.raw`\[\[`,
		lookaheadRegExp: /\[\[(.*?)(?:\|(~)?(.*?))?\]\]/mg,
		handler(w) {
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				const text = lookaheadMatch[1];
				let link = text;
				if(lookaheadMatch[3]) {
					// Pretty bracketted link
					link = lookaheadMatch[3];
				}
				if(isLinkExternal(link)) {
					w.output.push({
						type: "element",
						tag: "a",
						attributes: {
							href: {type: "string",value: link},
							"class": {type: "string",value: "tc-tiddlylink-external"},
							target: {type: "string",value: "_blank"}
						},
						children: [{
							type: "text",text
						}]
					});
				} else {
					w.output.push({
						type: "link",
						attributes: {
							to: {type: "string",value: link}
						},
						children: [{
							type: "text",text
						}]
					});
				}

				w.nextMatch = this.lookaheadRegExp.lastIndex;
			}
		}
	},
	{
		name: "wikiLink",
		match: `${textPrimitives.unWikiLink}?${textPrimitives.wikiLink}`,
		handler(w) {
			if(w.matchText.substr(0,1) == textPrimitives.unWikiLink) {
				w.outputText(w.output,w.matchStart + 1,w.nextMatch);
				return;
			}
			if(w.matchStart > 0) {
				const preRegExp = new RegExp(textPrimitives.anyLetterStrict,"mg");
				preRegExp.lastIndex = w.matchStart - 1;
				const preMatch = preRegExp.exec(w.source);
				if(preMatch.index == w.matchStart - 1) {
					w.outputText(w.output,w.matchStart,w.nextMatch);
					return;
				}
			}
			if(w.autoLinkWikiWords) {
				w.output.push({
					type: "link",
					attributes: {
						to: {type: "string",value: w.matchText}
					},
					children: [{
						type: "text",
						text: w.source.substring(w.matchStart,w.nextMatch)
					}]
				});
			} else {
				w.outputText(w.output,w.matchStart,w.nextMatch);
			}
		}
	},

	{
		name: "urlLink",
		match: textPrimitives.urlPattern,
		handler(w) {
			w.output.push({
				type: "element",
				tag: "a",
				attributes: {
					href: {type: "string",value: w.matchText},
					"class": {type: "string",value: "tc-tiddlylink-external"},
					target: {type: "string",value: "_blank"}
				},
				children: [{
					type: "text",text: w.source.substring(w.matchStart,w.nextMatch)
				}]
			});

		}
	},

	{
		name: "image",
		match: String.raw`\[[<>]?[Ii][Mm][Gg]\[`,
		// [<] sequence below is to avoid lessThan-questionMark sequence so TiddlyWikis can be included in PHP files
		lookaheadRegExp: /\[([<]?)(>?)[Ii][Mm][Gg]\[(?:([^\|\]]+)\|)?([^\[\]\|]+)\](?:\[([^\]]*)\])?\]/mg,
		handler(w) {
			const node = {
				type: "image",
				attributes: {}
			};
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			const imageParams = {};
			const linkParams = {};
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				if(lookaheadMatch[1]) {
					node.attributes.class = {type: "string",value: "classic-image-left"};
				} else if(lookaheadMatch[2]) {
					node.attributes.class = {type: "string",value: "classic-image-right"};
				}
				if(lookaheadMatch[3]) {
					node.attributes.tooltip = {type: "string",value: lookaheadMatch[3]};
				}
				node.attributes.source = {type: "string",value: lookaheadMatch[4]};
				if(lookaheadMatch[5]) {
					if(isLinkExternal(lookaheadMatch[5])) {
						w.output.push({
							type: "element",
							tag: "a",
							attributes: {
								href: {type: "string",value: lookaheadMatch[5]},
								"class": {type: "string",value: "tc-tiddlylink-external"},
								target: {type: "string",value: "_blank"}
							},
							children: [node]
						});
					} else {
						w.output.push({
							type: "link",
							attributes: {
								to: {type: "string",value: lookaheadMatch[5]}
							},
							children: [node]
						});
					}
				} else {
					w.output.push(node);
				}
				w.nextMatch = this.lookaheadRegExp.lastIndex;
			}
		}
	},

	{
		name: "html",
		match: "<[Hh][Tt][Mm][Ll]>",
		lookaheadRegExp: /<[Hh][Tt][Mm][Ll]>((?:.|\n)*?)<\/[Hh][Tt][Mm][Ll]>/mg,
		handler(w) {
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				w.output.push({type: "raw",html: lookaheadMatch[1]});
				w.nextMatch = this.lookaheadRegExp.lastIndex;
			}
		}
	},

	{
		name: "commentByBlock",
		match: "/%",
		lookaheadRegExp: /\/%((?:.|\n)*?)%\//mg,
		handler(w) {
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart)
				w.nextMatch = this.lookaheadRegExp.lastIndex;
		}
	},

	{
		name: "characterFormat",
		match: "''|//|__|\\^\\^|~~|--(?!\\s|$)|\\{\\{\\{|`",
		handler(w) {
			let e; let lookaheadRegExp; let lookaheadMatch;
			switch(w.matchText) {
				case "''": {
					e = {type: "element",tag: "strong",children: []};
					w.output.push(e);
					w.subWikifyTerm(e.children,/('')/mg);
					break;
				}
				case "//": {
					e = {type: "element",tag: "em",children: []};
					w.output.push(e);
					w.subWikifyTerm(e.children,/(\/\/)/mg);
					break;
				}
				case "__": {
					e = {type: "element",tag: "u",children: []};
					w.output.push(e);
					w.subWikifyTerm(e.children,/(__)/mg);
					break;
				}
				case "^^": {
					e = {type: "element",tag: "sup",children: []};
					w.output.push(e);
					w.subWikifyTerm(e.children,/(\^\^)/mg);
					break;
				}
				case "~~": {
					e = {type: "element",tag: "sub",children: []};
					w.output.push(e);
					w.subWikifyTerm(e.children,/(~~)/mg);
					break;
				}
				case "--": {
					e = {type: "element",tag: "strike",children: []};
					w.output.push(e);
					w.subWikifyTerm(e.children,/(--)/mg);
					break;
				}
				case "`": {
					lookaheadRegExp = /`((?:.|\n)*?)`/mg;
					lookaheadRegExp.lastIndex = w.matchStart;
					lookaheadMatch = lookaheadRegExp.exec(w.source);
					if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
						w.output.push({
							type: "element",tag: "code",
							children: [{type: "text",text: lookaheadMatch[1]}]
						});
					}
					break;
				}
				case "{{{": {
					lookaheadRegExp = /\{\{\{((?:.|\n)*?)\}\}\}/mg;
					lookaheadRegExp.lastIndex = w.matchStart;
					lookaheadMatch = lookaheadRegExp.exec(w.source);
					if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
						w.output.push({
							type: "element",tag: "code",
							children: [{type: "text",text: lookaheadMatch[1]}]
						});
						w.nextMatch = lookaheadRegExp.lastIndex;
					}
					break;
				}
			}
		}
	},

	{
		name: "customFormat",
		match: String.raw`@@|\{\{`,
		handler(w) {
			switch(w.matchText) {
				case "@@": {
					var e = {type: "element",tag: "span",children: []};
					w.output.push(e);
					const styles = inlineCssHelper(w);
					if(styles.length === 0)
						setAttr(e,"class","marked");
					else
						applyCssHelper(e,styles);
					w.subWikifyTerm(e.children,/(@@)/mg);
					break;
				}
				case "{{": {
					const lookaheadRegExp = /\{\{[\s]*([\-\w]+[\-\s\w]*)[\s]*\{(\n?)/mg;
					lookaheadRegExp.lastIndex = w.matchStart;
					const lookaheadMatch = lookaheadRegExp.exec(w.source);
					if(lookaheadMatch) {
						w.nextMatch = lookaheadRegExp.lastIndex;
						e = {
							type: "element",tag: lookaheadMatch[2] == "\n" ? "div" : "span",
							attributes: {"class": {type: "string",value: lookaheadMatch[1]}},children: []
						};
						w.output.push(e);
						w.subWikifyTerm(e.children,/(\}\}\})/mg);
					}
					break;
				}
			}
		}
	},

	{
		name: "mdash",
		match: "--",
		handler(w) {
			w.output.push({type: "entity",entity: "&mdash;"});
		}
	},

	{
		name: "lineBreak",
		match: String.raw`\n|<br ?/?>`,
		handler(w) {
			w.output.push({type: "element",tag: "br"});
		}
	},

	{
		name: "rawText",
		match: "\"{3}|<nowiki>",
		lookaheadRegExp: /(?:\"{3}|<nowiki>)((?:.|\n)*?)(?:\"{3}|<\/nowiki>)/mg,
		handler(w) {
			this.lookaheadRegExp.lastIndex = w.matchStart;
			const lookaheadMatch = this.lookaheadRegExp.exec(w.source);
			if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
				w.output.push({
					type: "text",text: lookaheadMatch[1]
				});
				w.nextMatch = this.lookaheadRegExp.lastIndex;
			}
		}
	},

	{
		name: "htmlEntitiesEncoding",
		match: "&#?[a-zA-Z0-9]{2,8};",
		handler(w) {
			w.output.push({type: "entity",entity: w.matchText});
		}
	}

];

exports.rules = rules;
