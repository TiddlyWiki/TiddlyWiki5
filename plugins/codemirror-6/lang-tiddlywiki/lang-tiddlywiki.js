/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-tiddlywiki/lang-tiddlywiki.js
type: application/javascript
module-type: codemirror6-plugin

TiddlyWiki5 language support for CodeMirror 6
Built with Rollup - DO NOT EDIT DIRECTLY

@license MIT
\*/
"use strict";
var e, t, n = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-state.js"),
	r = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-view.js"),
	i = require("$:/plugins/tiddlywiki/codemirror-6/lib/lezer-common.js"),
	s = require("$:/plugins/tiddlywiki/codemirror-6/lib/lezer-highlight.js"),
	a = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-language.js"),
	o = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-autocomplete.js"),
	l = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-lang-html.js");

function c(e) {
	return e === t.Space || e === t.Tab
}! function(e) {
	e[e.Document = 1] = "Document", e[e.Pragma = 2] = "Pragma", e[e.PragmaMark = 3] = "PragmaMark", e[e.PragmaKeyword = 4] = "PragmaKeyword", e[e.PragmaName = 5] = "PragmaName", e[e.PragmaParams = 6] = "PragmaParams", e[e.PragmaBody = 7] = "PragmaBody", e[e.PragmaEnd = 8] = "PragmaEnd", e[e.MacroDefinition = 9] = "MacroDefinition", e[e.ProcedureDefinition = 10] = "ProcedureDefinition", e[e.FunctionDefinition = 11] = "FunctionDefinition", e[e.WidgetDefinition = 12] = "WidgetDefinition", e[e.RulesPragma = 13] = "RulesPragma", e[e.ImportPragma = 14] = "ImportPragma", e[e.ParametersPragma = 15] = "ParametersPragma", e[e.WhitespacePragma = 16] = "WhitespacePragma", e[e.Paragraph = 17] = "Paragraph", e[e.Heading1 = 18] = "Heading1", e[e.Heading2 = 19] = "Heading2", e[e.Heading3 = 20] = "Heading3", e[e.Heading4 = 21] = "Heading4", e[e.Heading5 = 22] = "Heading5", e[e.Heading6 = 23] = "Heading6", e[e.HeadingMark = 24] = "HeadingMark", e[e.BulletList = 25] = "BulletList", e[e.OrderedList = 26] = "OrderedList", e[e.DefinitionList = 27] = "DefinitionList", e[e.ListItem = 28] = "ListItem", e[e.DefinitionTerm = 29] = "DefinitionTerm", e[e.DefinitionDescription = 30] = "DefinitionDescription", e[e.ListMark = 31] = "ListMark", e[e.BlockQuote = 32] = "BlockQuote", e[e.QuoteMark = 33] = "QuoteMark", e[e.BlockQuoteClass = 34] = "BlockQuoteClass", e[e.Table = 35] = "Table", e[e.TableHeader = 36] = "TableHeader", e[e.TableBody = 37] = "TableBody", e[e.TableFooter = 38] = "TableFooter", e[e.TableCaption = 39] = "TableCaption", e[e.TableRow = 40] = "TableRow", e[e.TableCell = 41] = "TableCell", e[e.TableHeaderCell = 42] = "TableHeaderCell", e[e.TableDelimiter = 43] = "TableDelimiter", e[e.TableClass = 44] = "TableClass", e[e.TableMarker = 45] = "TableMarker", e[e.FencedCode = 46] = "FencedCode", e[e.CodeMark = 47] = "CodeMark", e[e.CodeInfo = 48] = "CodeInfo", e[e.CodeText = 49] = "CodeText", e[e.PlainText = 50] = "PlainText", e[e.TypedBlock = 51] = "TypedBlock", e[e.TypedBlockMark = 52] = "TypedBlockMark", e[e.TypedBlockType = 53] = "TypedBlockType", e[e.HardLineBreaks = 54] = "HardLineBreaks", e[e.HardLineBreaksMark = 55] = "HardLineBreaksMark", e[e.HorizontalRule = 56] = "HorizontalRule", e[e.CommentBlock = 57] = "CommentBlock", e[e.CommentMarker = 58] = "CommentMarker", e[e.HTMLBlock = 59] = "HTMLBlock", e[e.HTMLEndTag = 60] = "HTMLEndTag", e[e.Widget = 61] = "Widget", e[e.WidgetEnd = 62] = "WidgetEnd", e[e.WidgetName = 63] = "WidgetName", e[e.TagName = 64] = "TagName", e[e.TagMark = 65] = "TagMark", e[e.TagAttributes = 66] = "TagAttributes", e[e.Attribute = 67] = "Attribute", e[e.AttributeName = 68] = "AttributeName", e[e.AttributeValue = 69] = "AttributeValue", e[e.AttributeString = 70] = "AttributeString", e[e.AttributeNumber = 71] = "AttributeNumber", e[e.AttributeIndirect = 72] = "AttributeIndirect", e[e.AttributeFiltered = 73] = "AttributeFiltered", e[e.AttributeMacro = 74] = "AttributeMacro", e[e.AttributeSubstituted = 75] = "AttributeSubstituted", e[e.SelfClosingMarker = 76] = "SelfClosingMarker", e[e.TransclusionBlock = 77] = "TransclusionBlock", e[e.FilteredTransclusionBlock = 78] = "FilteredTransclusionBlock", e[e.MacroCallBlock = 79] = "MacroCallBlock", e[e.Bold = 80] = "Bold", e[e.BoldMark = 81] = "BoldMark", e[e.Italic = 82] = "Italic", e[e.ItalicMark = 83] = "ItalicMark", e[e.Underline = 84] = "Underline", e[e.UnderlineMark = 85] = "UnderlineMark", e[e.Strikethrough = 86] = "Strikethrough", e[e.StrikethroughMark = 87] = "StrikethroughMark", e[e.Superscript = 88] = "Superscript", e[e.SuperscriptMark = 89] = "SuperscriptMark", e[e.Subscript = 90] = "Subscript", e[e.SubscriptMark = 91] = "SubscriptMark", e[e.Highlight = 92] = "Highlight", e[e.HighlightMark = 93] = "HighlightMark", e[e.InlineCode = 94] = "InlineCode", e[e.InlineCodeMark = 95] = "InlineCodeMark", e[e.WikiLink = 96] = "WikiLink", e[e.WikiLinkMark = 97] = "WikiLinkMark", e[e.LinkText = 98] = "LinkText", e[e.LinkSeparator = 99] = "LinkSeparator", e[e.LinkTarget = 100] = "LinkTarget", e[e.ExternalLink = 101] = "ExternalLink", e[e.ExtLinkMark = 102] = "ExtLinkMark", e[e.ImageLink = 103] = "ImageLink", e[e.ImageMark = 104] = "ImageMark", e[e.ImageSource = 105] = "ImageSource", e[e.ImageWidth = 106] = "ImageWidth", e[e.ImageHeight = 107] = "ImageHeight", e[e.ImageClass = 108] = "ImageClass", e[e.ImageAlt = 109] = "ImageAlt", e[e.ImageTooltip = 110] = "ImageTooltip", e[e.CamelCaseLink = 111] = "CamelCaseLink", e[e.SystemLink = 112] = "SystemLink", e[e.URLLink = 113] = "URLLink", e[e.Transclusion = 114] = "Transclusion", e[e.TransclusionMark = 115] = "TransclusionMark", e[e.TransclusionTarget = 116] = "TransclusionTarget", e[e.TransclusionField = 117] = "TransclusionField", e[e.TransclusionIndex = 118] = "TransclusionIndex", e[e.TransclusionTemplate = 119] = "TransclusionTemplate", e[e.FilteredTransclusion = 120] = "FilteredTransclusion", e[e.FilteredTransclusionMark = 121] = "FilteredTransclusionMark", e[e.FilterExpression = 122] = "FilterExpression", e[e.MacroCall = 123] = "MacroCall", e[e.MacroCallMark = 124] = "MacroCallMark", e[e.MacroName = 125] = "MacroName", e[e.MacroParam = 126] = "MacroParam", e[e.MacroParamName = 127] = "MacroParamName", e[e.MacroParamValue = 128] = "MacroParamValue", e[e.InlineWidget = 129] = "InlineWidget", e[e.HTMLTag = 130] = "HTMLTag", e[e.OpenTag = 131] = "OpenTag", e[e.CloseTag = 132] = "CloseTag", e[e.Escape = 133] = "Escape", e[e.Entity = 134] = "Entity", e[e.HardBreak = 135] = "HardBreak", e[e.Dash = 136] = "Dash", e[e.Variable = 137] = "Variable", e[e.VariableMark = 138] = "VariableMark", e[e.VariableName = 139] = "VariableName", e[e.FilterSubstitution = 140] = "FilterSubstitution", e[e.FilterSubstitutionMark = 141] = "FilterSubstitutionMark", e[e.Placeholder = 142] = "Placeholder", e[e.PlaceholderMark = 143] = "PlaceholderMark", e[e.SubstitutedParam = 144] = "SubstitutedParam", e[e.SubstitutedParamMark = 145] = "SubstitutedParamMark", e[e.SubstitutedParamName = 146] = "SubstitutedParamName", e[e.FilterRun = 147] = "FilterRun", e[e.FilterOperator = 148] = "FilterOperator", e[e.FilterOperatorName = 149] = "FilterOperatorName", e[e.FilterOperand = 150] = "FilterOperand", e[e.FilterVariable = 151] = "FilterVariable", e[e.FilterTextRef = 152] = "FilterTextRef", e[e.FilterRegexp = 153] = "FilterRegexp", e[e.StyledBlock = 154] = "StyledBlock", e[e.StyledBlockMark = 155] = "StyledBlockMark", e[e.StyledBlockClass = 156] = "StyledBlockClass", e[e.ConditionalBlock = 157] = "ConditionalBlock", e[e.Conditional = 158] = "Conditional", e[e.ConditionalMark = 159] = "ConditionalMark", e[e.ConditionalKeyword = 160] = "ConditionalKeyword", e[e.ConditionalBranch = 161] = "ConditionalBranch", e[e.Text = 162] = "Text", e[e.ProcessingInstruction = 163] = "ProcessingInstruction", e[e.Mark = 164] = "Mark"
}(e || (e = {})), new Set([e.Document, e.Pragma, e.MacroDefinition, e.ProcedureDefinition, e.FunctionDefinition, e.WidgetDefinition, e.RulesPragma, e.ImportPragma, e.ParametersPragma, e.WhitespacePragma, e.Paragraph, e.Heading1, e.Heading2, e.Heading3, e.Heading4, e.Heading5, e.Heading6, e.BulletList, e.OrderedList, e.DefinitionList, e.ListItem, e.DefinitionTerm, e.DefinitionDescription, e.BlockQuote, e.Table, e.TableHeader, e.TableBody, e.TableFooter, e.TableCaption, e.TableRow, e.FencedCode, e.TypedBlock, e.HardLineBreaks, e.HorizontalRule, e.CommentBlock, e.HTMLBlock, e.Widget, e.TransclusionBlock, e.FilteredTransclusionBlock, e.MacroCallBlock]), new Set([e.Document, e.MacroDefinition, e.ProcedureDefinition, e.FunctionDefinition, e.WidgetDefinition, e.BulletList, e.OrderedList, e.DefinitionList, e.BlockQuote, e.Table, e.TableHeader, e.TableBody, e.TableFooter, e.Widget, e.HTMLBlock]),
	function(e) {
		e[e.Space = 32] = "Space", e[e.Tab = 9] = "Tab", e[e.Newline = 10] = "Newline", e[e.CarriageReturn = 13] = "CarriageReturn", e[e.Backslash = 92] = "Backslash", e[e.Exclamation = 33] = "Exclamation", e[e.Hash = 35] = "Hash", e[e.Dollar = 36] = "Dollar", e[e.Percent = 37] = "Percent", e[e.Ampersand = 38] = "Ampersand", e[e.Apostrophe = 39] = "Apostrophe", e[e.LeftParen = 40] = "LeftParen", e[e.RightParen = 41] = "RightParen", e[e.Asterisk = 42] = "Asterisk", e[e.Plus = 43] = "Plus", e[e.Comma = 44] = "Comma", e[e.Dash = 45] = "Dash", e[e.Dot = 46] = "Dot", e[e.Slash = 47] = "Slash", e[e.Colon = 58] = "Colon", e[e.Semicolon = 59] = "Semicolon", e[e.LessThan = 60] = "LessThan", e[e.Equals = 61] = "Equals", e[e.GreaterThan = 62] = "GreaterThan", e[e.Question = 63] = "Question", e[e.At = 64] = "At", e[e.LeftBracket = 91] = "LeftBracket", e[e.RightBracket = 93] = "RightBracket", e[e.Caret = 94] = "Caret", e[e.Underscore = 95] = "Underscore", e[e.Backtick = 96] = "Backtick", e[e.LeftBrace = 123] = "LeftBrace", e[e.Pipe = 124] = "Pipe", e[e.RightBrace = 125] = "RightBrace", e[e.Tilde = 126] = "Tilde"
	}(t || (t = {}));
class d {
	constructor(e, t, n, r = []) {
		this.type = e, this.from = t, this.to = n, this.children = r
	}
}

function u(e, t, n, r) {
	return new d(e, t, n, r)
}
class f {
	constructor() {
		this.text = "", this.baseIndent = 0, this.basePos = 0, this.depth = 0, this.markers = [], this.pos = 0, this.indent = 0, this.next = -1
	}
	skipSpace(e) {
		let t = e;
		for(; t < this.text.length;) {
			if(!c(this.text.charCodeAt(t))) break;
			t++
		}
		return t
	}
	moveBase(e) {
		this.basePos = e, this.baseIndent = this.countIndent(e, this.text.length)
	}
	moveBaseColumn(e) {
		this.moveBase(this.findColumn(e))
	}
	addMarker(e) {
		this.markers.push(e)
	}
	countIndent(e, n = 0, r = 0) {
		for(let i = n; i < e; i++) {
			const e = this.text.charCodeAt(i);
			if(e === t.Space) r++;
			else {
				if(e !== t.Tab) break;
				r += 4 - r % 4
			}
		}
		return r
	}
	findColumn(e) {
		let n = 0,
			r = 0;
		for(; n < this.text.length && r < e;) {
			this.text.charCodeAt(n) === t.Tab ? r += 4 - r % 4 : r++, n++
		}
		return n
	}
	reset(e) {
		this.text = e, this.baseIndent = this.basePos = this.pos = this.indent = 0, this.depth = 0, this.markers = [], this.next = e.length ? e.charCodeAt(0) : -1
	}
	scrub() {
		if(!this.basePos) return this.text;
		let e = "";
		for(const t of this.markers) e += this.text.slice(e.length, t.from) + " ".repeat(t.to - t.from);
		return e + this.text.slice(e.length)
	}
}
class p {
	static create(e, t, n, r, i) {
		return new p(e, t, n, r + (r << 8) + e + (t << 4) | 0, i, [], [])
	}
	constructor(e, t, n, r, i, s, a) {
		this.type = e, this.value = t, this.from = n, this.hash = r, this.end = i, this.children = s, this.positions = a
	}
	addChild(e, t) {
		e.prop(i.NodeProp.contextHash) !== this.hash && (e = new i.Tree(e.type, e.children, e.positions, e.length, [
			[i.NodeProp.contextHash, this.hash]
		])), this.children.push(e), this.positions.push(t)
	}
	toTree(e, t = this.end) {
		const n = this.children.length - 1;
		return n >= 0 && (t = Math.max(t, this.positions[n] + this.children[n].length + this.from)), new i.Tree(e.types[this.type], this.children, this.positions, t - this.from).balance({
			makeTree: (e, t, n) => new i.Tree(i.NodeType.none, e, t, n, [
				[i.NodeProp.contextHash, this.hash]
			])
		})
	}
}
class h {
	constructor(e, t, n, r) {
		this.type = e, this.from = t, this.to = n, this.side = r
	}
}
class m {
	constructor() {
		this.content = [], this.nodes = []
	}
	write(e, t, n, r = 0) {
		this.content.push(e, t, n, 4 + 4 * r)
	}
	writeElements(e, t = 0) {
		for(const n of e) this.writeElement(n, t)
	}
	writeElement(e, t = 0) {
		const n = this.content.length;
		this.writeElements(e.children, t), this.content.push(e.type, e.from + t, e.to + t, this.content.length + 4 - n)
	}
	finish(e, t) {
		return i.Tree.build({
			buffer: this.content,
			nodeSet: this.nodeSet,
			topID: e,
			length: t
		})
	}
}
class g {
	setMacroParams(e) {
		this._macroParams = e ? new Set(e) : null
	}
	isValidMacroParam(e) {
		return null !== this._macroParams && this._macroParams.has(e)
	}
	get hasMacroParams() {
		return null !== this._macroParams
	}
	get atEnd() {
		return this._atEnd
	}
	savePosition() {
		return {
			lineStart: this.lineStart,
			lineEnd: this.lineEnd,
			lineText: this._line.text,
			atEnd: this._atEnd
		}
	}
	restorePosition(e) {
		this.lineStart = e.lineStart, this.lineEnd = e.lineEnd, this._line.reset(e.lineText), this._atEnd = e.atEnd
	}
	constructor(t, n, r, i) {
		this.parser = t, this.input = n, this.ranges = i, this.buf = new m, this.stack = [], this._atEnd = !1, this.dontInject = new Set, this.fragments = null, this.fragmentIndex = 0, this.fragmentEnd = -1, this.lineStart = 0, this.lineEnd = 0, this.stoppedAt = null, this._macroParams = null, this.to = i[i.length - 1].to, this.fragments = r.length ? r : null, this.buf.nodeSet = t.nodeSet;
		const s = p.create(e.Document, 0, i[0].from, 0, 0);
		this.stack.push(s), this._line = new f, this.lineStart = i[0].from, this.lineEnd = this.lineStart, this.moveToNextLine()
	}
	get line() {
		return this._line
	}
	get parsers() {
		return this.parser.blockParsers
	}
	get pragmaParsers() {
		return this.parser.pragmaParsers
	}
	get block() {
		return this.stack[this.stack.length - 1]
	}
	prevLineEnd() {
		return this.lineStart <= 0 ? 0 : this.atEnd && this.lineStart === this.to ? this.lineStart : this.lineStart - 1
	}
	nextLine() {
		return this.lineStart = this.lineEnd, this.lineStart >= this.to ? (this._atEnd = !0, !1) : (this.lineEnd = this.findLineEnd(), this._line.reset(this.readLineText()), !0)
	}
	peekLine() {
		const e = this.lineEnd;
		if(e >= this.to) return null;
		let n = this.findLineEnd(e);
		if(n > e) {
			this.input.read(n - 1, n).charCodeAt(0) === t.Newline && (n--, n > e && this.input.read(n - 1, n).charCodeAt(0) === t.CarriageReturn && n--)
		}
		return this.input.read(e, n)
	}
	findLineEnd(e = this.lineEnd) {
		let n = e;
		for(; n < this.to;) {
			const e = this.input.read(n, n + 1).charCodeAt(0);
			if(e === t.Newline) return n + 1;
			if(e === t.CarriageReturn) return n++, n < this.to && this.input.read(n, n + 1).charCodeAt(0) === t.Newline && n++, n;
			n++
		}
		return n
	}
	readLineText() {
		let e = this.lineEnd;
		if(e > this.lineStart) {
			this.input.read(e - 1, e).charCodeAt(0) === t.Newline && (e--, e > this.lineStart && this.input.read(e - 1, e).charCodeAt(0) === t.CarriageReturn && e--)
		}
		return this.input.read(this.lineStart, e)
	}
	moveToNextLine() {
		this.nextLine() || this._line.reset("")
	}
	startContext(e, t, n = 0) {
		const r = p.create(e, n, t, this.block.hash, t);
		this.stack.push(r), this.addNode(e, t)
	}
	startComposite(e, t, n = 0) {
		const r = p.create(e, n, t, this.block.hash, t);
		this.stack.push(r)
	}
	addElement(e) {
		this.buf.writeElement(e, -this.block.from)
	}
	addNode(e, t, n) {
		"number" == typeof e ? this.buf.write(e, t - this.block.from, (n ?? t) - this.block.from, 0) : this.block.addChild(e, t - this.block.from)
	}
	addLeafElement(e, t) {
		this.addElement(this.elt(t.type, t.from, t.to, [...e.marks.map(e => this.elt(e.type, e.from, e.to)), ...t.children]))
	}
	finishContext() {
		const e = this.stack.pop(),
			t = e.toTree(this.parser.nodeSet);
		this.dontInject.has(t) || this.block.addChild(t, e.from - this.block.from)
	}
	elt(e, t, n, r) {
		return new d(e, t, n, r)
	}
	advance() {
		if(null !== this.stoppedAt && this.lineStart > this.stoppedAt) return this.finishDocument();
		for(this.lineStart === this.ranges[0].from && this.parsePragmas(); !this.atEnd;) this.parseBlock();
		return this.finishDocument()
	}
	parsePragmas() {
		let e = !1;
		for(; !this.atEnd;) {
			const n = this._line.text,
				r = n.trim();
			if("" === r) {
				this.nextLine();
				continue
			}
			if(n.charCodeAt(this._line.skipSpace(0)) !== t.Backslash) {
				if(e && !this.looksLikeBlockStart(r) && this.hasUpcomingPragma()) {
					this.nextLine();
					continue
				}
				break
			}
			if("\\" === r) {
				this.nextLine();
				continue
			}
			let i = !1;
			for(const t of this.pragmaParsers) {
				const n = t.parse(this, this._line);
				if(null !== n) {
					for(const e of n) this.addElement(e);
					i = !0, e = !0;
					break
				}
			}
			if(!i) {
				if(e && this.hasUpcomingPragma()) {
					this.nextLine();
					continue
				}
				break
			}
		}
	}
	looksLikeBlockStart(e) {
		if(!e) return !1;
		const n = e.charCodeAt(0);
		return !!e.startsWith("```") || (!!e.startsWith("$$$") || (n === t.Exclamation || (n === t.Asterisk || n === t.Hash || n === t.Semicolon || n === t.Colon || (!!e.startsWith("<<<") || (!!/^-{3,}\s*$/.test(e) || (n === t.Pipe || (n === t.LessThan || (!!e.startsWith("{{") || (!!e.startsWith("<<") || !!e.startsWith("<%"))))))))))
	}
	hasUpcomingPragma() {
		const e = this.savePosition();
		let n = !1;
		for(; this.nextLine();) {
			const e = this._line.text.trim();
			if("" !== e)
				if(e.startsWith("```"))
					for(; this.nextLine() && !this._line.text.trim().startsWith("```"););
				else if(e.startsWith("$$$"))
				for(; this.nextLine() && !this._line.text.trim().startsWith("$$$"););
			else if(e.charCodeAt(0) === t.Backslash) {
				n = !0;
				break
			}
		}
		return this.restorePosition(e), n
	}
	parseBlock() {
		if("" !== this._line.text.trim()) {
			for(const e of this.parsers) {
				const t = e.parse(this, this._line);
				if(!1 !== t) return void(!0 === t && this.nextLine())
			}
			this.parseParagraph()
		} else this.nextLine()
	}
	parseParagraph() {
		const t = this.lineStart,
			n = [this._line.text];
		for(; this.nextLine();) {
			const e = this._line.text;
			if("" === e.trim()) {
				n.push(e);
				continue
			}
			let t = !1;
			for(const n of this.parsers) {
				const n = e.charCodeAt(0);
				if(this.isBlockStarter(e, n)) {
					t = !0;
					break
				}
			}
			if(t) break;
			n.push(e)
		}
		const r = n.join("\n"),
			i = this.parser.parseInline(r, t),
			s = this.elt(e.Paragraph, t, t + r.length, i);
		this.addElement(s)
	}
	isBlockStarter(e, n) {
		if(n === t.Exclamation) return !0;
		if(n === t.Asterisk || n === t.Hash || n === t.Semicolon || n === t.Colon || n === t.GreaterThan) return !0;
		if(n === t.Pipe) return !0;
		if(n === t.Backtick && e.startsWith("```")) return !0;
		if(n === t.Dollar && e.startsWith("$$$")) return !0;
		if(n === t.Dash && /^-{3,}$/.test(e.trim())) return !0;
		if(n === t.LessThan) {
			if(e.startsWith("\x3c!--")) return !e.includes("--\x3e");
			const t = e.match(/^<(\$?[a-zA-Z][a-zA-Z0-9\-\.]*)/);
			if(!t) return !1;
			const n = t[1];
			if(/\/>\s*$/.test(e)) return !1;
			const r = n.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
			return !new RegExp(`</${r}>`).test(e)
		}
		return !(n !== t.LeftBrace || !e.startsWith("{{")) || n === t.Backslash
	}
	finishDocument() {
		for(; this.stack.length > 1;) this.finishContext();
		const t = this.stack[0],
			n = this.buf.content;
		if(n.length > 0) {
			return i.Tree.build({
				buffer: n,
				nodeSet: this.parser.nodeSet,
				topID: e.Document,
				length: this.to - t.from
			})
		}
		return t.toTree(this.parser.nodeSet, this.to)
	}
	get parsedPos() {
		return this.lineStart
	}
	stopAt(e) {
		this.stoppedAt = e
	}
	parseContentRange(e, t, n = !0) {
		if(e >= t) return [];
		const r = this.input.read(e, t),
			i = this.parser.parse(r);
		return this.extractElements(i, e)
	}
	extractElements(e, t) {
		const n = [],
			r = e.cursor();
		if(r.firstChild())
			do {
				const e = this.nodeToElement(r, t);
				e && n.push(e)
			} while(r.nextSibling());
		return n
	}
	nodeToElement(e, t) {
		const n = e.type.id,
			r = e.from + t,
			i = e.to + t,
			s = [];
		if(e.firstChild()) {
			do {
				const n = this.nodeToElement(e, t);
				n && s.push(n)
			} while(e.nextSibling());
			e.parent()
		}
		return new d(n, r, i, s)
	}
}
class k {
	constructor(e, t, n) {
		this.parser = e, this.text = t, this.offset = n, this.parts = []
	}
	get end() {
		return this.offset + this.text.length
	}
	char(e) {
		const t = e - this.offset;
		return t < 0 || t >= this.text.length ? -1 : this.text.charCodeAt(t)
	}
	slice(e, t) {
		const n = Math.max(0, e - this.offset),
			r = Math.min(this.text.length, t - this.offset);
		return this.text.slice(n, r)
	}
	get hasOpenLink() {
		for(let e = this.parts.length - 1; e >= 0; e--) {
			const t = this.parts[e];
			if(t instanceof h && t.type.isLink) return !0
		}
		return !1
	}
	skipSpace(e) {
		let t = e - this.offset;
		for(; t < this.text.length && c(this.text.charCodeAt(t));) t++;
		return t + this.offset
	}
	addElement(e) {
		return this.parts.push(e), e.to
	}
	addDelimiter(e, t, n, r, i) {
		const s = (r ? 1 : 0) | (i ? 2 : 0);
		return this.parts.push(new h(e, t, n, s)), n
	}
	append(e) {
		return this.parts.push(e), e.to
	}
	elt(e, t, n, r) {
		return new d(e, t, n, r)
	}
	findOpeningDelimiter(e) {
		for(let t = this.parts.length - 1; t >= 0; t--) {
			const n = this.parts[t];
			if(n instanceof h && n.type === e && 1 & n.side) return t
		}
		return null
	}
	takeContent(t) {
		const n = [];
		for(let r = t; r < this.parts.length; r++) {
			const t = this.parts[r];
			t instanceof d ? n.push(t) : t instanceof h && n.push(this.elt(e.Text, t.from, t.to))
		}
		return this.parts.length = t, n
	}
	resolveDelimiters() {
		for(let t = 0; t < this.parts.length; t++) {
			const n = this.parts[t];
			if(!(n instanceof h && 2 & n.side)) continue;
			const r = n.type;
			if(!r.resolve) continue;
			let i = null;
			for(let e = t - 1; e >= 0; e--) {
				const t = this.parts[e];
				if(t instanceof h && t.type === r && 1 & t.side) {
					i = e;
					break
				}
			}
			if(null === i) continue;
			const s = this.parts[i],
				a = [];
			r.mark && a.push(this.elt(this.getMarkType(r.mark), s.from, s.to));
			for(let n = i + 1; n < t; n++) {
				const t = this.parts[n];
				t instanceof d ? a.push(t) : t instanceof h && a.push(this.elt(e.Text, t.from, t.to)), this.parts[n] = null
			}
			r.mark && a.push(this.elt(this.getMarkType(r.mark), n.from, n.to));
			const o = this.getResolveType(r.resolve),
				l = this.elt(o, s.from, n.to, a);
			this.parts[i] = l, this.parts[t] = null
		}
		const t = [];
		for(const n of this.parts) n instanceof d ? t.push(n) : n instanceof h && t.push(this.elt(e.Text, n.from, n.to));
		return t
	}
	getResolveType(t) {
		return {
			Bold: e.Bold,
			Italic: e.Italic,
			Underline: e.Underline,
			Strikethrough: e.Strikethrough,
			Superscript: e.Superscript,
			Subscript: e.Subscript,
			Highlight: e.Highlight,
			InlineCode: e.InlineCode
		} [t] || e.Text
	}
	getMarkType(t) {
		return {
			BoldMark: e.BoldMark,
			ItalicMark: e.ItalicMark,
			UnderlineMark: e.UnderlineMark,
			StrikethroughMark: e.StrikethroughMark,
			SuperscriptMark: e.SuperscriptMark,
			SubscriptMark: e.SubscriptMark,
			HighlightMark: e.HighlightMark,
			InlineCodeMark: e.InlineCodeMark
		} [t] || e.Mark
	}
	parse() {
		const e = this.parser.inlineParsers;
		let t = this.offset;
		for(; t < this.end;) {
			const n = this.char(t);
			let r = !1;
			for(const i of e) {
				const e = i.parse(this, n, t);
				if(e >= 0) {
					t = e, r = !0;
					break
				}
			}
			r || t++
		}
		return this.resolveDelimiters()
	}
}
const x = /^\s*\\define\s+([^(\s]+)\s*\(\s*([^)]*)\s*\)(.*)$/,
	b = /^\s*\\define\s+([^(\s]+)\s*\(\s*([^)]*)\s*\)\s*$/,
	y = /^\s*\\(function|procedure|widget)\s+([^(\s]+)\s*\(\s*([^)]*)\s*\)(.*)$/,
	w = /^\s*\\(function|procedure|widget)\s+([^(\s]+)\s*\(\s*([^)]*)\s*\)$/,
	$ = /^\s*\\rules\s+(only|except)\s+(.*)$/,
	T = /^\s*\\import\s+(.*)$/,
	M = /^\s*\\parameters\s*\(\s*([^)]*)\s*\)$/,
	S = /^\s*\\whitespace\s+(trim|notrim)$/;

function C(e, t) {
	const n = /^\s*\\(define|procedure|function|widget)\s+([^(\s]+)\s*\([^)]*\)\s*$/,
		r = /^\s*\\end(?:\s+(\S+))?\s*$/,
		i = e.lineStart + e.line.text.length + 1,
		s = [];
	for(; e.nextLine();) {
		const a = e.line.text,
			o = n.exec(a);
		if(o) {
			s.push(o[2]);
			continue
		}
		const l = r.exec(a);
		if(l) {
			const n = l[1];
			if(0 === s.length) {
				if(!n || n === t) return {
					bodyStart: i,
					bodyEnd: e.lineStart - 1,
					endStart: e.lineStart,
					endEnd: e.lineStart + a.length
				}
			} else if(n) {
				if(n === s[s.length - 1]) s.pop();
				else if(n === t) return {
					bodyStart: i,
					bodyEnd: e.lineStart - 1,
					endStart: e.lineStart,
					endEnd: e.lineStart + a.length
				}
			} else s.pop()
		}
	}
	return null
}

function L(t, n) {
	const r = [];
	let i = 0;
	const s = t.length;
	for(; i < s;) {
		const a = t[i];
		if(/\s/.test(a)) i++;
		else if("[" === a) {
			const a = i;
			i++;
			const o = [];
			for(; i < s && "]" !== t[i];) {
				"!" === t[i] && i++;
				const r = t[i];
				if("[" === r) {
					i++;
					const r = i;
					let a = 1;
					for(; i < s && a > 0;) "[" === t[i] ? a++ : "]" === t[i] && a--, a > 0 && i++;
					o.push(u(e.FilterOperand, n + r, n + i)), i < s && "]" === t[i] && i++
				} else if("<" === r) {
					i++;
					const r = i;
					for(; i < s && ">" !== t[i];) i++;
					const a = t.slice(r, i),
						l = /^__([^_]+)__$/.exec(a);
					if(l) {
						const t = l[1],
							s = n + r - 1,
							a = n + i + 1,
							c = n + r,
							d = [u(e.SubstitutedParamMark, c, c + 2), u(e.SubstitutedParamName, c + 2, c + 2 + t.length), u(e.SubstitutedParamMark, c + 2 + t.length, n + i)];
						o.push(u(e.SubstitutedParam, s, a, d))
					} else o.push(u(e.FilterVariable, n + r, n + i));
					i < s && i++
				} else if("{" === r) {
					i++;
					const r = i;
					for(; i < s && "}" !== t[i];) i++;
					o.push(u(e.FilterTextRef, n + r, n + i)), i < s && i++
				} else if("/" === r) {
					i++;
					const r = i;
					for(; i < s && "/" !== t[i];) "\\" === t[i] && i++, i++;
					for(o.push(u(e.FilterRegexp, n + r, n + i)), i < s && i++; i < s && /[gimsuy]/.test(t[i]);) i++
				} else if(/[a-zA-Z]/.test(r)) {
					const r = i;
					for(; i < s && /[a-zA-Z0-9\-_:!]/.test(t[i]);) i++;
					o.push(u(e.FilterOperatorName, n + r, n + i))
				} else i++
			}
			i < s && "]" === t[i] && i++, r.push(u(e.FilterOperator, n + a, n + i, o))
		} else if("+" === a || "-" === a || "~" === a || "=" === a) i++;
		else if(":" === a)
			for(i++; i < s && /[a-zA-Z0-9\-_]/.test(t[i]);) i++;
		else i++
	}
	return r
}

function v(t, n) {
	const r = [];
	if(!t.trim()) return r;
	const i = /\s*([A-Za-z0-9\-_]+)(?:\s*:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^,\s)]+)))?/g;
	let s;
	for(; null !== (s = i.exec(t));) {
		const t = n + s.index,
			i = t + s[0].length;
		r.push(u(e.PragmaParams, t, i))
	}
	return r
}
const P = /^\s*\\define(?:\s+([^(\s]+))?(?:\s*\(([^)]*)\)?)?\s*$/,
	E = /^\s*\\(d|de|def|defi|defin)(?:\s+([^(\s]+))?(?:\s*\(([^)]*)\)?)?\s*$/,
	B = /^\s*\\(function|procedure|widget)(?:\s+([^(\s]+))?(?:\s*\(([^)]*)\)?)?\s*$/,
	A = /^\s*\\(f|fu|fun|func|funct|functi|functio)(?:\s+([^(\s]+))?(?:\s*\(([^)]*)\)?)?\s*$/,
	I = /^\s*\\(p|pr|pro|proc|proce|proced|procedu|procedur)(?:\s+([^(\s]+))?(?:\s*\(([^)]*)\)?)?\s*$/,
	F = /^\s*\\(w|wi|wid|widg|widge)(?:\s+([^(\s]+))?(?:\s*\(([^)]*)\)?)?\s*$/,
	O = /^\s*\\rules(?:\s+(only|except)?)?(?:\s+(.*))?$/,
	D = /^\s*\\(r|ru|rul|rule)\s*$/,
	N = /^\s*\\import\s*(.*)$/,
	H = /^\s*\\(i|im|imp|impo|impor)\s*$/,
	W = /^\s*\\parameters(?:\s*\(([^)]*)?)?\s*$/,
	R = /^\s*\\(pa|par|para|param|parame|paramet|paramete|parameter)\s*$/,
	_ = /^\s*\\whitespace(?:\s+(.*))?$/,
	z = /^\s*\\(wh|whi|whit|white|whites|whitesp|whitespa|whitespac)\s*$/,
	V = /^\s*\\(e|en|end)(?:\s+.*)?\s*$/,
	Z = [{
		name: "macrodef",
		parse(t, n) {
			const r = n.text,
				i = b.exec(r);
			if(i) {
				const n = t.lineStart,
					s = i[1],
					a = i[2],
					o = r.indexOf("\\"),
					l = t.savePosition(),
					c = C(t, s);
				if(c) {
					const i = [u(e.PragmaMark, n + o, n + o + 1), u(e.PragmaKeyword, n + o + 1, n + o + 7), u(e.PragmaName, n + r.indexOf(s), n + r.indexOf(s) + s.length)];
					if(a) {
						const e = n + r.indexOf("(") + 1;
						i.push(...v(a, e))
					}
					if(c.bodyEnd > c.bodyStart) {
						const e = t.parseContentRange(c.bodyStart, c.bodyEnd, !0);
						i.push(...e)
					}
					return i.push(u(e.PragmaEnd, c.endStart, c.endEnd)), t.nextLine(), [u(e.MacroDefinition, n, t.prevLineEnd(), i)]
				}
				t.restorePosition(l)
			}
			const s = x.exec(r);
			if(s) {
				const n = t.lineStart,
					i = s[1],
					a = s[2],
					o = s[3],
					l = r.indexOf("\\");
				if(o) {
					const s = t.savePosition(),
						c = C(t, i);
					if(c) {
						const s = [u(e.PragmaMark, n + l, n + l + 1), u(e.PragmaKeyword, n + l + 1, n + l + 7), u(e.PragmaName, n + r.indexOf(i), n + r.indexOf(i) + i.length)];
						if(a) {
							const e = n + r.indexOf("(") + 1;
							s.push(...v(a, e))
						}
						const d = n + r.length - o.length;
						if(c.bodyEnd > d) {
							const e = t.parseContentRange(d, c.bodyEnd, !0);
							s.push(...e)
						}
						return s.push(u(e.PragmaEnd, c.endStart, c.endEnd)), t.nextLine(), [u(e.MacroDefinition, n, t.prevLineEnd(), s)]
					}
					t.restorePosition(s)
				}
				const c = [u(e.PragmaMark, n + l, n + l + 1), u(e.PragmaKeyword, n + l + 1, n + l + 7), u(e.PragmaName, n + r.indexOf(i), n + r.indexOf(i) + i.length)];
				if(a) {
					const e = n + r.indexOf("(") + 1;
					c.push(...v(a, e))
				}
				if(o) {
					const e = n + r.length - o.length,
						i = t.parser.parseInline(o, e);
					c.push(...i)
				}
				return t.nextLine(), [u(e.MacroDefinition, n, t.prevLineEnd(), c)]
			}
			return null
		}
	}, {
		name: "fnprocdef",
		parse(t, n) {
			const r = n.text,
				i = w.exec(r);
			if(i) {
				const n = t.lineStart,
					s = i[1],
					a = i[2],
					o = i[3],
					l = r.indexOf("\\");
				let c;
				switch(s) {
					case "function":
						c = e.FunctionDefinition;
						break;
					case "procedure":
						c = e.ProcedureDefinition;
						break;
					case "widget":
						c = e.WidgetDefinition;
						break;
					default:
						return null
				}
				const d = t.savePosition(),
					f = C(t, a);
				if(f) {
					const i = [u(e.PragmaMark, n + l, n + l + 1), u(e.PragmaKeyword, n + l + 1, n + l + 1 + s.length), u(e.PragmaName, n + r.indexOf(a), n + r.indexOf(a) + a.length)];
					if(o) {
						const e = n + r.indexOf("(") + 1;
						i.push(...v(o, e))
					}
					if(f.bodyEnd > f.bodyStart)
						if("function" === s) {
							const n = L(t.input.read(f.bodyStart, f.bodyEnd), f.bodyStart);
							i.push(u(e.FilterExpression, f.bodyStart, f.bodyEnd, n))
						} else {
							const e = t.parseContentRange(f.bodyStart, f.bodyEnd, !0);
							i.push(...e)
						} return i.push(u(e.PragmaEnd, f.endStart, f.endEnd)), t.nextLine(), [u(c, n, t.prevLineEnd(), i)]
				}
				t.restorePosition(d)
			}
			const s = y.exec(r);
			if(s) {
				const n = t.lineStart,
					i = s[1],
					a = s[2],
					o = s[3],
					l = s[4],
					c = r.indexOf("\\");
				let d;
				switch(i) {
					case "function":
						d = e.FunctionDefinition;
						break;
					case "procedure":
						d = e.ProcedureDefinition;
						break;
					case "widget":
						d = e.WidgetDefinition;
						break;
					default:
						return null
				}
				if(l) {
					const s = t.savePosition(),
						f = C(t, a);
					if(f) {
						const s = [u(e.PragmaMark, n + c, n + c + 1), u(e.PragmaKeyword, n + c + 1, n + c + 1 + i.length), u(e.PragmaName, n + r.indexOf(a), n + r.indexOf(a) + a.length)];
						if(o) {
							const e = n + r.indexOf("(") + 1;
							s.push(...v(o, e))
						}
						const p = n + r.length - l.length;
						if(f.bodyEnd > p)
							if("function" === i) {
								const n = L(t.input.read(p, f.bodyEnd), p);
								s.push(u(e.FilterExpression, p, f.bodyEnd, n))
							} else {
								const e = t.parseContentRange(p, f.bodyEnd, !0);
								s.push(...e)
							} return s.push(u(e.PragmaEnd, f.endStart, f.endEnd)), t.nextLine(), [u(d, n, t.prevLineEnd(), s)]
					}
					t.restorePosition(s)
				}
				const f = [u(e.PragmaMark, n + c, n + c + 1), u(e.PragmaKeyword, n + c + 1, n + c + 1 + i.length), u(e.PragmaName, n + r.indexOf(a), n + r.indexOf(a) + a.length)];
				if(o) {
					const e = n + r.indexOf("(") + 1;
					f.push(...v(o, e))
				}
				if(l) {
					const s = n + r.length - l.length;
					if("function" === i) {
						const t = L(l, s);
						f.push(u(e.FilterExpression, s, n + r.length, t))
					} else {
						const e = t.parser.parseInline(l, s);
						f.push(...e)
					}
				}
				return t.nextLine(), [u(d, n, t.prevLineEnd(), f)]
			}
			return null
		}
	}, {
		name: "rules",
		parse(t, n) {
			const r = $.exec(n.text);
			if(!r) return null;
			const i = t.lineStart;
			r[1], r[2];
			const s = n.text.indexOf("\\"),
				a = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 6)];
			return t.nextLine(), [u(e.RulesPragma, i, t.prevLineEnd(), a)]
		}
	}, {
		name: "import",
		parse(t, n) {
			const r = T.exec(n.text);
			if(!r) return null;
			const i = t.lineStart,
				s = r[1],
				a = n.text.indexOf("\\"),
				o = i + n.text.indexOf(s),
				l = L(s, o),
				c = [u(e.PragmaMark, i + a, i + a + 1), u(e.PragmaKeyword, i + a + 1, i + a + 7), u(e.FilterExpression, o, o + s.length, l)];
			return t.nextLine(), [u(e.ImportPragma, i, t.prevLineEnd(), c)]
		}
	}, {
		name: "parameters",
		parse(t, n) {
			const r = M.exec(n.text);
			if(!r) return null;
			const i = t.lineStart,
				s = r[1],
				a = n.text.indexOf("\\"),
				o = [u(e.PragmaMark, i + a, i + a + 1), u(e.PragmaKeyword, i + a + 1, i + a + 11)];
			if(s) {
				const e = i + n.text.indexOf("(") + 1;
				o.push(...v(s, e))
			}
			return t.nextLine(), [u(e.ParametersPragma, i, t.prevLineEnd(), o)]
		}
	}, {
		name: "whitespace",
		parse(t, n) {
			if(!S.exec(n.text)) return null;
			const r = t.lineStart,
				i = n.text.indexOf("\\"),
				s = [u(e.PragmaMark, r + i, r + i + 1), u(e.PragmaKeyword, r + i + 1, r + i + 11)];
			return t.nextLine(), [u(e.WhitespacePragma, r, t.prevLineEnd(), s)]
		}
	}, {
		name: "partial",
		parse(t, n) {
			const r = n.text,
				i = t.lineStart,
				s = r.indexOf("\\");
			let a = P.exec(r);
			if(a) {
				const n = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 7)],
					o = a[1];
				if(o) {
					const t = i + r.indexOf(o);
					n.push(u(e.PragmaName, t, t + o.length))
				}
				const l = a[2];
				if(void 0 !== l) {
					const e = i + r.indexOf("(") + 1;
					l && n.push(...v(l, e))
				}
				return t.nextLine(), [u(e.MacroDefinition, i, t.prevLineEnd(), n)]
			}
			if(a = B.exec(r), a) {
				const n = a[1];
				let o;
				switch(n) {
					case "function":
						o = e.FunctionDefinition;
						break;
					case "procedure":
						o = e.ProcedureDefinition;
						break;
					case "widget":
						o = e.WidgetDefinition;
						break;
					default:
						return null
				}
				const l = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)],
					c = a[2];
				if(c) {
					const t = i + r.indexOf(c);
					l.push(u(e.PragmaName, t, t + c.length))
				}
				const d = a[3];
				if(void 0 !== d) {
					const e = i + r.indexOf("(") + 1;
					d && l.push(...v(d, e))
				}
				return t.nextLine(), [u(o, i, t.prevLineEnd(), l)]
			}
			if(a = O.exec(r), a) {
				const n = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 6)];
				return t.nextLine(), [u(e.RulesPragma, i, t.prevLineEnd(), n)]
			}
			if(a = N.exec(r), a) {
				const n = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 7)],
					o = a[1];
				if(o && o.trim()) {
					const t = i + r.indexOf(o);
					n.push(u(e.FilterExpression, t, t + o.length))
				}
				return t.nextLine(), [u(e.ImportPragma, i, t.prevLineEnd(), n)]
			}
			if(a = W.exec(r), a) {
				const n = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 11)],
					o = a[1];
				if(void 0 !== o) {
					const e = i + r.indexOf("(") + 1;
					o && n.push(...v(o, e))
				}
				return t.nextLine(), [u(e.ParametersPragma, i, t.prevLineEnd(), n)]
			}
			if(a = _.exec(r), a) {
				const n = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 11)];
				return t.nextLine(), [u(e.WhitespacePragma, i, t.prevLineEnd(), n)]
			}
			if(a = E.exec(r), a) {
				const n = a[1],
					o = a[2],
					l = a[3],
					c = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				if(o) {
					const t = i + r.indexOf(o);
					c.push(u(e.PragmaName, t, t + o.length))
				}
				if(void 0 !== l) {
					const e = i + r.indexOf("(") + 1;
					l && c.push(...v(l, e))
				}
				return t.nextLine(), [u(e.MacroDefinition, i, t.prevLineEnd(), c)]
			}
			if(a = A.exec(r), a) {
				const n = a[1],
					o = a[2],
					l = a[3],
					c = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				if(o) {
					const t = i + r.indexOf(o);
					c.push(u(e.PragmaName, t, t + o.length))
				}
				if(void 0 !== l) {
					const e = i + r.indexOf("(") + 1;
					l && c.push(...v(l, e))
				}
				return t.nextLine(), [u(e.FunctionDefinition, i, t.prevLineEnd(), c)]
			}
			if(a = I.exec(r), a) {
				const n = a[1],
					o = a[2],
					l = a[3],
					c = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				if(o) {
					const t = i + r.indexOf(o);
					c.push(u(e.PragmaName, t, t + o.length))
				}
				if(void 0 !== l) {
					const e = i + r.indexOf("(") + 1;
					l && c.push(...v(l, e))
				}
				return t.nextLine(), [u(e.ProcedureDefinition, i, t.prevLineEnd(), c)]
			}
			if(a = F.exec(r), a) {
				const n = a[1],
					o = a[2],
					l = a[3],
					c = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				if(o) {
					const t = i + r.indexOf(o);
					c.push(u(e.PragmaName, t, t + o.length))
				}
				if(void 0 !== l) {
					const e = i + r.indexOf("(") + 1;
					l && c.push(...v(l, e))
				}
				return t.nextLine(), [u(e.WidgetDefinition, i, t.prevLineEnd(), c)]
			}
			if(a = D.exec(r), a) {
				const n = a[1],
					r = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				return t.nextLine(), [u(e.RulesPragma, i, t.prevLineEnd(), r)]
			}
			if(a = H.exec(r), a) {
				const n = a[1],
					r = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				return t.nextLine(), [u(e.ImportPragma, i, t.prevLineEnd(), r)]
			}
			if(a = R.exec(r), a) {
				const n = a[1],
					r = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				return t.nextLine(), [u(e.ParametersPragma, i, t.prevLineEnd(), r)]
			}
			if(a = z.exec(r), a) {
				const n = a[1],
					r = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				return t.nextLine(), [u(e.WhitespacePragma, i, t.prevLineEnd(), r)]
			}
			if(a = V.exec(r), a) {
				const n = a[1],
					r = [u(e.PragmaMark, i + s, i + s + 1), u(e.PragmaKeyword, i + s + 1, i + s + 1 + n.length)];
				return t.nextLine(), [u(e.PragmaEnd, i, t.prevLineEnd(), r)]
			}
			return null
		}
	}],
	j = {
		whitespaceOrStart: /\s|^$/
	};

function K(e, t, n, r = 2) {
	let i = t;
	for(; e.char(i - 1) === n;) i--;
	let s = t + r;
	for(; e.char(s) === n;) s++;
	const a = s - i,
		o = e.slice(i - 1, i);
	e.slice(s, s + 1);
	var l;
	let c;
	return c = !(l = o, j.whitespaceOrStart.test(l)) && a > r ? s - r : i, e.slice(c - 1, c), e.slice(c + r, c + r + 1), {
		runStart: i,
		runEnd: s,
		runLength: a,
		matchStart: c,
		canOpen: !0,
		canClose: !0
	}
}

function U(e) {
	const {
		charCode: t,
		delimType: n,
		delimLength: r = 2,
		rejectOddRuns: i = !1
	} = e;
	return function(e, s, a) {
		if(s !== t) return -1;
		for(let n = 1; n < r; n++)
			if(e.char(a + n) !== t) return -1;
		const o = K(e, a, t, r);
		return o ? i && o.runLength % 2 == 1 || a !== o.matchStart ? -1 : e.addDelimiter(n, a, a + r, o.canOpen, o.canClose) : -1
	}
}

function Q(t, n) {
	const r = [],
		i = t.indexOf("!!");
	if(i >= 0) return i > 0 && r.push(u(e.TransclusionTarget, n, n + i)), r.push(u(e.TransclusionField, n + i, n + t.length)), r;
	const s = t.indexOf("##");
	return s >= 0 ? (s > 0 && r.push(u(e.TransclusionTarget, n, n + s)), r.push(u(e.TransclusionIndex, n + s, n + t.length)), r) : (t.length > 0 && r.push(u(e.TransclusionTarget, n, n + t.length)), r)
}

function q(t, n) {
	const r = [];
	let i = 0;
	const s = Math.min(t.length, 5e3);
	let a = 0;
	for(; i < s && a < 200;) {
		for(a++; i < s && /\s/.test(t[i]);) i++;
		if(i >= s) break;
		const o = i;
		let l = i;
		for(; l < s && /[a-zA-Z0-9\-_]/.test(t[l]);) l++;
		if(l > i && ":" === t[l]) {
			const a = i;
			i = l + 1;
			const c = i;
			let d = i;
			if('"' === t[i] || "'" === t[i]) {
				const e = t[i];
				for(i++; i < s && t[i] !== e;) "\\" === t[i] && i++, i++;
				i < s && i++, d = i
			} else if("[[[" === t.slice(i, i + 3)) {
				for(i += 3; i < s && "]]]" !== t.slice(i, i + 3);) i++;
				i < s && (i += 3), d = i
			} else if("[[" === t.slice(i, i + 2)) {
				for(i += 2; i < s && "]]" !== t.slice(i, i + 2);) i++;
				i < s && (i += 2), d = i
			} else {
				for(; i < s && !/[\s>]/.test(t[i]);) i++;
				d = i
			}
			const f = [u(e.MacroParamName, n + a, n + l), u(e.MacroParamValue, n + c, n + d)];
			r.push(u(e.MacroParam, n + o, n + d, f))
		} else {
			const a = i;
			if('"' === t[i] || "'" === t[i]) {
				const e = t[i];
				for(i++; i < s && t[i] !== e;) "\\" === t[i] && i++, i++;
				i < s && i++
			} else if("[[[" === t.slice(i, i + 3)) {
				for(i += 3; i < s && "]]]" !== t.slice(i, i + 3);) i++;
				i < s && (i += 3)
			} else if("[[" === t.slice(i, i + 2)) {
				for(i += 2; i < s && "]]" !== t.slice(i, i + 2);) i++;
				i < s && (i += 2)
			} else
				for(; i < s && !/[\s>]/.test(t[i]);) i++;
			const l = [u(e.MacroParamValue, n + a, n + i)];
			r.push(u(e.MacroParam, n + o, n + i, l))
		}
	}
	return r
}
const G = {
		name: "Heading",
		parse(n, r) {
			const i = function(e) {
				if(e.next !== t.Exclamation) return -1;
				let n = 1,
					r = 1;
				for(; r < e.text.length && e.text.charCodeAt(r) === t.Exclamation && n < 6;) n++, r++;
				return n
			}(r);
			if(i < 0) return !1;
			const s = n.lineStart,
				a = s + i,
				o = a,
				l = r.text.slice(i),
				c = n.parser.parseInline(l, o),
				d = [e.Heading1, e.Heading2, e.Heading3, e.Heading4, e.Heading5, e.Heading6][i - 1],
				f = [u(e.HeadingMark, s, a), ...c];
			return n.addElement(u(d, s, s + r.text.length, f)), !0
		}
	},
	J = /^-{3,}\s*$/,
	X = {
		name: "HorizontalRule",
		parse: (t, n) => !!J.test(n.text) && (t.addElement(u(e.HorizontalRule, t.lineStart, t.lineStart + n.text.length)), !0)
	},
	Y = /^```(\S*)/,
	ee = /^```\s*$/,
	te = {
		name: "FencedCode",
		parse(t, n) {
			const r = Y.exec(n.text);
			if(!r) return !1;
			const i = t.lineStart,
				s = r[1],
				a = [u(e.CodeMark, i, i + 3)];
			s && a.push(u(e.CodeInfo, i + 3, i + 3 + s.length));
			let o = "",
				l = t.lineStart + n.text.length + 1,
				c = !1;
			for(; t.nextLine();) {
				if(ee.test(t.line.text)) {
					a.push(u(e.CodeText, l, t.prevLineEnd())), a.push(u(e.CodeMark, t.lineStart, t.lineStart + 3)), c = !0;
					break
				}
				o && (o += "\n"), o += t.line.text
			}
			if(!c) {
				const n = t.prevLineEnd();
				n > l && a.push(u(e.CodeText, l, n))
			}
			const d = c ? t.lineStart + t.line.text.length : t.prevLineEnd();
			return t.addElement(u(e.FencedCode, i, d, a)), !0
		}
	},
	ne = /^\$\$\$([\w\/\-\.\+]*)$/,
	re = /^\$\$\$\s*$/,
	ie = {
		name: "TypedBlock",
		parse(t, n) {
			const r = ne.exec(n.text);
			if(!r) return !1;
			const i = t.lineStart,
				s = r[1],
				a = [u(e.TypedBlockMark, i, i + 3)];
			s && a.push(u(e.TypedBlockType, i + 3, i + 3 + s.length));
			const o = "text/plain" === s ? e.PlainText : e.CodeText;
			let l = t.lineStart + n.text.length + 1,
				c = !1;
			for(; t.nextLine();)
				if(re.test(t.line.text)) {
					a.push(u(o, l, t.prevLineEnd())), a.push(u(e.TypedBlockMark, t.lineStart, t.lineStart + 3)), c = !0;
					break
				} if(!c) {
				const e = t.prevLineEnd();
				e > l && a.push(u(o, l, e))
			}
			const d = c ? t.lineStart + t.line.text.length : t.prevLineEnd();
			return t.addElement(u(e.TypedBlock, i, d, a)), !0
		}
	},
	se = /^"""\s*$/,
	ae = {
		name: "HardLineBreaks",
		parse(t, n) {
			if(!se.test(n.text)) return !1;
			const r = t.lineStart,
				i = [u(e.HardLineBreaksMark, r, r + 3)];
			let s = t.lineStart + n.text.length + 1,
				a = !1;
			for(; t.nextLine();)
				if(se.test(t.line.text)) {
					if(t.lineStart - 1 > s) {
						const e = t.input.read(s, t.lineStart - 1),
							n = t.parser.parseInline(e, s);
						i.push(...n)
					}
					i.push(u(e.HardLineBreaksMark, t.lineStart, t.lineStart + 3)), a = !0;
					break
				} if(!a && t.lineStart > s) {
				const e = t.input.read(s, t.lineStart),
					n = t.parser.parseInline(e, s);
				i.push(...n)
			}
			const o = a ? t.lineStart + t.line.text.length : t.lineStart;
			return t.addElement(u(e.HardLineBreaks, r, o, i)), !0
		}
	},
	oe = /^([*#;:>]+)/,
	le = {
		"*": {
			list: e.BulletList,
			item: e.ListItem
		},
		"#": {
			list: e.OrderedList,
			item: e.ListItem
		},
		";": {
			list: e.DefinitionList,
			item: e.DefinitionTerm
		},
		":": {
			list: e.DefinitionList,
			item: e.DefinitionDescription
		},
		">": {
			list: e.BlockQuote,
			item: e.ListItem
		}
	};

function ce(e, t) {
	return e === t || !(";" !== e && ":" !== e || ";" !== t && ":" !== t)
}
const de = {
		name: "List",
		parse(t, n) {
			const r = oe.exec(n.text);
			if(!r) return !1;
			const i = r[1][0],
				s = le[i];
			if(!s) return !1;
			const a = t.lineStart,
				o = [];
			for(;;) {
				const n = oe.exec(t.line.text);
				if(!n || !ce(i, n[1][0])) break;
				const r = n[1],
					s = t.lineStart,
					a = s + r.length,
					l = t.line.text.slice(r.length),
					c = t.parser.parseInline(l, a),
					d = [u(e.ListMark, s, a), ...c],
					f = le[r[r.length - 1]]?.item || e.ListItem;
				o.push(u(f, s, s + t.line.text.length, d));
				const p = t.peekLine();
				if(null === p) break;
				const h = oe.exec(p);
				if(!h || !ce(i, h[1][0])) break;
				t.nextLine()
			}
			return t.addElement(u(s.list, a, t.lineStart + t.line.text.length, o)), !0
		}
	},
	ue = /^<<<(.*)$/,
	fe = {
		name: "MultiLineBlockQuote",
		parse(t, n) {
			const r = ue.exec(n.text);
			if(!r) return !1;
			if(!n.text.startsWith("<<<") || n.text.startsWith("<<<<")) return !1;
			const i = t.lineStart,
				s = i + 3,
				a = r[1].trim(),
				o = [u(e.QuoteMark, i, s)];
			if(a) {
				const t = r[1],
					n = s + (t.length - t.trimStart().length);
				o.push(u(e.BlockQuoteClass, n, n + a.length))
			}
			const l = i + n.text.length + 1;
			let c = l,
				d = -1,
				f = -1,
				p = "",
				h = "";
			for(; t.nextLine();) {
				const e = t.line.text;
				if(e.startsWith("<<<") && !e.startsWith("<<<<")) {
					d = t.lineStart, f = t.lineStart + e.length, c = d - 1, h = e, p = e.slice(3).trim();
					break
				}
			}
			if(c > l) {
				const e = t.parseContentRange(l, c, !1);
				o.push(...e)
			}
			if(d >= 0 && (o.push(u(e.QuoteMark, d, d + 3)), p)) {
				const e = h.slice(3),
					n = d + 3 + (e.length - e.trimStart().length),
					r = t.parser.parseInline(p, n);
				o.push(...r)
			}
			const m = f >= 0 ? f : t.prevLineEnd();
			return t.addElement(u(e.BlockQuote, i, m, o)), !0
		}
	},
	pe = /^\|.*\|([fhck])?\s*$/,
	he = {
		c: e.TableCaption,
		k: e.TableClass,
		h: e.TableHeader,
		f: e.TableFooter
	},
	me = {
		name: "Table",
		parse(t, n) {
			if(!pe.test(n.text)) return !1;
			const r = t.lineStart,
				i = [];
			for(;;) {
				const n = t.line.text,
					r = pe.exec(n);
				if(!r) break;
				const s = t.lineStart,
					a = r[1],
					o = a ? he[a] : e.TableRow,
					l = ge(n, s, t, a);
				if(i.push(u(o, s, s + n.length, l)), !t.nextLine()) break
			}
			return t.addElement(u(e.Table, r, t.prevLineEnd(), i)), !0
		}
	};

function ge(n, r, i, s) {
	const a = [];
	let o = 0,
		l = -1;
	const c = s ? n.length - 1 : n.length;
	for(; o < c;) {
		if(n.charCodeAt(o) === t.Pipe) {
			if(l >= 0) {
				const t = n.slice(l, o),
					s = t.length - t.trimStart().length,
					c = t.trim(),
					d = c.startsWith("!"),
					f = d ? e.TableHeaderCell : e.TableCell,
					p = l + s + (d ? 1 : 0),
					h = d ? c.slice(1) : c,
					m = i.parser.parseInline(h, r + p);
				a.push(u(f, r + l, r + o, m))
			}
			a.push(u(e.TableDelimiter, r + o, r + o + 1)), l = -1, o++
		} else l < 0 && (l = o), o++
	}
	return s && a.push(u(e.TableMarker, r + n.length - 1, r + n.length)), a
}
const ke = /^<!--/,
	xe = {
		name: "CommentBlock",
		parse(t, n) {
			const r = n.text.trim();
			if(ke.test(r)) {
				const i = t.lineStart;
				if(r.match(/-->/)) {
					const r = i + n.text.indexOf("--\x3e") + 3;
					t.addElement(u(e.CommentBlock, i, r, [u(e.CommentMarker, i, i + 4), u(e.CommentMarker, r - 3, r)]));
					const s = n.text.slice(n.text.indexOf("--\x3e") + 3);
					if(s.trim()) {
						const n = t.parser.parseInline(s, r),
							i = t.elt(e.Paragraph, r, r + s.length, n);
						t.addElement(i)
					}
					return !0
				}
				for(; t.nextLine();) {
					const n = t.line.text,
						r = n.indexOf("--\x3e");
					if(-1 !== r) {
						const s = t.lineStart + r + 3;
						t.addElement(u(e.CommentBlock, i, s));
						const a = n.slice(r + 3);
						if(a.trim()) {
							const n = t.parser.parseInline(a, s),
								r = t.elt(e.Paragraph, s, s + a.length, n);
							t.addElement(r)
						}
						return !0
					}
				}
				return t.addElement(u(e.CommentBlock, i, t.lineStart)), !0
			}
			return !1
		}
	},
	be = /^\{\{([^{}|]*)(?:\|\|([^{}|]+))?(?:\|([^{}]+))?\}\}\s*$/,
	ye = {
		name: "TransclusionBlock",
		parse(t, n) {
			const r = be.exec(n.text);
			if(!r) return !1;
			const i = t.lineStart,
				s = r[1],
				a = r[2];
			r[3];
			const o = [u(e.TransclusionMark, i, i + 2)],
				l = Q(s, i + 2);
			o.push(...l);
			let c = i + 2 + s.length;
			return a && (o.push(u(e.TransclusionTemplate, c + 2, c + 2 + a.length)), c += 2 + a.length), o.push(u(e.TransclusionMark, i + n.text.length - 2, i + n.text.length)), t.addElement(u(e.TransclusionBlock, i, i + n.text.length, o)), !0
		}
	};

function we(t, n) {
	const r = [];
	let i = 0;
	const s = t.length;
	for(; i < s;) {
		const a = t[i];
		if(/\s/.test(a)) i++;
		else {
			if("[" === a) {
				const a = i;
				i++;
				const o = [];
				for(; i < s && "]" !== t[i];) {
					"!" === t[i] && i++;
					const r = t[i];
					if("[" === r) {
						i++;
						const r = i;
						let a = 1;
						for(; i < s && a > 0;) "[" === t[i] ? a++ : "]" === t[i] && a--, a > 0 && i++;
						o.push(u(e.FilterOperand, n + r, n + i)), i < s && "]" === t[i] && i++
					} else if("<" === r) {
						i++;
						const r = i;
						for(; i < s && ">" !== t[i];) i++;
						o.push(u(e.FilterVariable, n + r, n + i)), i < s && i++
					} else if("{" === r) {
						i++;
						const r = i;
						for(; i < s && "}" !== t[i];) i++;
						o.push(u(e.FilterTextRef, n + r, n + i)), i < s && i++
					} else if("/" === r) {
						i++;
						const r = i;
						for(; i < s && "/" !== t[i];) "\\" === t[i] && i++, i++;
						for(o.push(u(e.FilterRegexp, n + r, n + i)), i < s && i++; i < s && /[gimsuy]/.test(t[i]);) i++
					} else if(/[a-zA-Z]/.test(r)) {
						const r = i;
						for(; i < s && /[a-zA-Z0-9\-_:!]/.test(t[i]);) i++;
						o.push(u(e.FilterOperatorName, n + r, n + i))
					} else i++
				}
				i < s && "]" === t[i] && i++;
				const l = i;
				r.push(u(e.FilterOperator, n + a, n + l, o));
				continue
			}
			if("[" === a && "[" === t[i + 1]) {
				const a = i;
				for(i += 2; i < s && ("]" !== t[i] || "]" !== t[i + 1]);) i++;
				i += 2, r.push(u(e.FilterOperand, n + a, n + i));
				continue
			}
			if("+" !== a && "-" !== a && "~" !== a && ":" !== a) i++;
			else
				for(i++; i < s && /[a-zA-Z]/.test(t[i]);) i++
		}
	}
	return r
}
const $e = {
		name: "FilteredTransclusionBlock",
		parse(t, n) {
			if(!n.text.startsWith("{{{")) return !1;
			const r = n.text.indexOf("}}}", 3);
			if(-1 === r) return !1;
			const i = n.text.slice(r + 3).trim();
			let s = "";
			if(i) {
				if(!i.startsWith("||")) return !1;
				s = i.slice(2)
			}
			const a = t.lineStart,
				o = n.text.slice(3, r),
				l = we(o, a + 3),
				c = [u(e.FilteredTransclusionMark, a, a + 3), u(e.FilterExpression, a + 3, a + 3 + o.length, l), u(e.FilteredTransclusionMark, a + 3 + o.length, a + 6 + o.length)];
			return s && c.push(u(e.TransclusionTemplate, a + r + 5, a + r + 5 + s.length)), t.addElement(u(e.FilteredTransclusionBlock, a, a + n.text.length, c)), !0
		}
	},
	Te = {
		name: "MacroCallBlock",
		parse(t, n) {
			if(!n.text.startsWith("<<")) return !1;
			const r = t.lineStart;
			let i = 2;
			for(; i < n.text.length && !/[\s>]/.test(n.text[i]);) i++;
			const s = n.text.slice(2, i);
			if(!s) return !1;
			let a = n.text.indexOf(">>", 2),
				o = n.text,
				l = t.lineStart + n.text.length;
			const c = t => {
				const n = /^__([^_]+)__$/.exec(s);
				if(n) {
					const i = n[1],
						a = r + 2,
						o = [u(e.SubstitutedParamMark, a, a + 2), u(e.SubstitutedParamName, a + 2, a + 2 + i.length), u(e.SubstitutedParamMark, a + 2 + i.length, a + s.length)];
					t.push(u(e.SubstitutedParam, a, a + s.length, o))
				} else t.push(u(e.MacroName, r + 2, r + 2 + s.length))
			};
			if(-1 === a) {
				for(; t.nextLine();) {
					const e = t.line.text;
					o += "\n" + e, l = t.lineStart + e.length;
					const n = e.trimEnd();
					if(n.endsWith(">>")) {
						a = o.length - (e.length - n.lastIndexOf(">>"));
						break
					}
				}
				if(-1 === a) {
					const n = [u(e.MacroCallMark, r, r + 2)];
					c(n);
					const s = o.slice(i);
					if(s.trim()) {
						const e = q(s, r + i);
						n.push(...e)
					}
					return t.addElement(u(e.MacroCallBlock, r, l, n)), !0
				}
			} else if(n.text.slice(a + 2).trim()) return !1;
			const d = [u(e.MacroCallMark, r, r + 2)];
			c(d);
			const f = o.slice(i, a);
			if(f.trim()) {
				const e = q(f, r + i);
				d.push(...e)
			}
			const p = r + a;
			return d.push(u(e.MacroCallMark, p, p + 2)), t.addElement(u(e.MacroCallBlock, r, l, d)), !0
		}
	};

function Me(t, n, r) {
	const i = [];
	let s = 0;
	const a = t.length;
	for(; s < a;) {
		for(; s < a && /\s/.test(t[s]);) s++;
		if(s >= a) break;
		const r = s;
		for(; s < a && /[a-zA-Z0-9\-_:.$]/.test(t[s]);) s++;
		if(s === r) {
			s++;
			continue
		}
		const o = s;
		for(; s < a && /\s/.test(t[s]);) s++;
		if(s >= a || "=" !== t[s]) {
			const t = [u(e.AttributeName, n + r, n + o)];
			i.push(u(e.Attribute, n + r, n + o, t));
			continue
		}
		for(s++; s < a && /\s/.test(t[s]);) s++;
		if(s >= a) {
			const t = [u(e.AttributeName, n + r, n + o)];
			i.push(u(e.Attribute, n + r, n + s, t));
			continue
		}
		const l = s;
		let c = s,
			d = e.AttributeValue;
		const f = t[s];
		if('"' === f && '"""' === t.slice(s, s + 3)) {
			for(s += 3; s < a && '"""' !== t.slice(s, s + 3);) s++;
			'"""' === t.slice(s, s + 3) && (s += 3), c = s, d = e.AttributeString;
			const f = [u(e.AttributeName, n + r, n + o), u(d, n + l, n + c)];
			i.push(u(e.Attribute, n + r, n + c, f));
			continue
		}
		if('"' === f || "'" === f) {
			const p = f;
			s++;
			const h = s;
			for(; s < a && t[s] !== p;) "\\" === t[s] && s + 1 < a && s++, s++;
			const m = s;
			s < a && s++, c = s, d = e.AttributeString;
			const g = t.slice(r, o).toLowerCase();
			if("filter" === g || "$filter" === g) {
				const s = we(t.slice(h, m), n + h),
					a = [u(e.Mark, n + l, n + h), u(e.FilterExpression, n + h, n + m, s), u(e.Mark, n + m, n + c)],
					d = [u(e.AttributeName, n + r, n + o), u(e.AttributeFiltered, n + l, n + c, a)];
				i.push(u(e.Attribute, n + r, n + c, d));
				continue
			}
		} else if("{" === f) {
			if("{{{" === t.slice(s, s + 3)) {
				const f = s;
				s += 3;
				const p = s;
				for(; s < a && "}}}" !== t.slice(s, s + 3);) s++;
				const h = s;
				"}}}" === t.slice(s, s + 3) && (s += 3), c = s, d = e.AttributeFiltered;
				const m = we(t.slice(p, h), n + p),
					g = [u(e.FilteredTransclusionMark, n + f, n + f + 3), u(e.FilterExpression, n + p, n + h, m), u(e.FilteredTransclusionMark, n + h, n + c)],
					k = [u(e.AttributeName, n + r, n + o), u(d, n + l, n + c, g)];
				i.push(u(e.Attribute, n + r, n + c, k));
				continue
			}
			if("{{" === t.slice(s, s + 2)) {
				const f = s;
				s += 2;
				const p = s;
				for(; s < a && "}}" !== t.slice(s, s + 2);) s++;
				const h = s;
				"}}" === t.slice(s, s + 2) && (s += 2), c = s, d = e.AttributeIndirect;
				const m = Q(t.slice(p, h), n + p),
					g = [u(e.TransclusionMark, n + f, n + f + 2), ...m, u(e.TransclusionMark, n + h, n + c)],
					k = [u(e.AttributeName, n + r, n + o), u(d, n + l, n + c, g)];
				i.push(u(e.Attribute, n + r, n + c, k));
				continue
			}
			for(; s < a && !/[\s>]/.test(t[s]);) s++;
			c = s
		} else {
			if("<" === f && "<" === t[s + 1]) {
				const f = s;
				s += 2;
				const p = s;
				for(; s < a && /[a-zA-Z0-9\-_.$]/.test(t[s]);) s++;
				const h = s;
				let m = 1;
				for(; s < a && m > 0;)
					if("<<" === t.slice(s, s + 2)) m++, s += 2;
					else if(">>" === t.slice(s, s + 2)) {
					if(m--, 0 === m) break;
					s += 2
				} else s++;
				const g = s;
				">>" === t.slice(s, s + 2) && (s += 2), c = s, d = e.AttributeMacro;
				const k = t.slice(p, h),
					x = [u(e.MacroCallMark, n + f, n + f + 2)],
					b = /^__([^_]+)__$/.exec(k);
				if(b) {
					const t = b[1],
						r = n + p,
						i = [u(e.SubstitutedParamMark, r, r + 2), u(e.SubstitutedParamName, r + 2, r + 2 + t.length), u(e.SubstitutedParamMark, r + 2 + t.length, n + h)];
					x.push(u(e.SubstitutedParam, r, n + h, i))
				} else x.push(u(e.MacroName, n + p, n + h));
				x.push(u(e.MacroCallMark, n + g, n + c));
				const y = [u(e.AttributeName, n + r, n + o), u(d, n + l, n + c, x)];
				i.push(u(e.Attribute, n + r, n + c, y));
				continue
			}
			if("`" === f) {
				let f, p;
				if("```" === t.slice(s, s + 3)) {
					for(f = s + 3, s += 3; s < a && "```" !== t.slice(s, s + 3);) s++;
					p = s, "```" === t.slice(s, s + 3) && (s += 3)
				} else {
					for(f = s + 1, s++; s < a && "`" !== t[s];) s++;
					p = s, s < a && s++
				}
				c = s, d = e.AttributeSubstituted;
				const h = [u(e.Mark, n + l, n + f)],
					m = t.slice(f, p);
				let g = 0;
				const k = n + f;
				for(; g < m.length;) {
					if("${" === m.slice(g, g + 2)) {
						let t = -1;
						for(let e = g + 2; e < m.length - 1; e++)
							if("}" === m[e] && "$" === m[e + 1]) {
								t = e;
								break
							} if(-1 !== t) {
							const n = [m.slice(g, t + 2), m.slice(g + 2, t)],
								r = k + g,
								i = r + n[0].length,
								s = r + 2,
								a = i - 2,
								o = we(n[1].trim(), s + (n[1].length - n[1].trimStart().length));
							h.push(u(e.FilterSubstitution, r, i, [u(e.FilterSubstitutionMark, r, r + 2), u(e.FilterExpression, s, a, o), u(e.FilterSubstitutionMark, i - 2, i)])), g += n[0].length;
							continue
						}
					}
					const t = m.slice(g).match(/^\$\(([^)]+)\)\$/);
					if(t) {
						const n = k + g,
							r = n + t[0].length,
							i = n + 2,
							s = i + t[1].length;
						h.push(u(e.Variable, n, r, [u(e.VariableMark, n, n + 2), u(e.VariableName, i, s), u(e.VariableMark, s, r)])), g += t[0].length
					} else g++
				}
				h.push(u(e.Mark, n + p, n + c));
				const x = [u(e.AttributeName, n + r, n + o), u(d, n + l, n + c, h)];
				i.push(u(e.Attribute, n + r, n + c, x));
				continue
			} {
				for(; s < a && !/[\s>\/]/.test(t[s]);) s++;
				c = s;
				const n = t.slice(l, c);
				d = /^-?\d+(\.\d+)?$/.test(n) ? e.AttributeNumber : e.AttributeString
			}
		}
		const p = [u(e.AttributeName, n + r, n + o), u(d, n + l, n + c)];
		i.push(u(e.Attribute, n + r, n + c, p))
	}
	return i
}
const Se = /^(\s*)<([a-zA-Z$][a-zA-Z0-9\-\.]*)/,
	Ce = /^(\s*)<\/([a-zA-Z$][a-zA-Z0-9\-\.]*)>/,
	Le = /\/>\s*$/,
	ve = {
		name: "HTMLBlock",
		parse(t, n) {
			const r = n.text,
				i = Ce.exec(r);
			if(i) {
				const n = i[1].length,
					s = i[2],
					a = s.startsWith("$"),
					o = t.lineStart,
					l = [],
					c = o + n;
				l.push(u(e.TagMark, c, c + 1)), l.push(u(e.TagMark, c + 1, c + 2));
				const d = o + n + 2;
				l.push(u(a ? e.WidgetName : e.TagName, d, d + s.length));
				const f = o + i[0].length;
				l.push(u(e.TagMark, f - 1, f)), t.addElement(u(a ? e.WidgetEnd : e.HTMLEndTag, o, f, l));
				const p = r.slice(i[0].length);
				if(p.trim()) {
					const n = t.parser.parseInline(p, f),
						r = t.elt(e.Paragraph, f, f + p.length, n);
					t.addElement(r)
				}
				return !0
			}
			const s = Se.exec(r);
			if(!s) return !1;
			const a = s[1].length,
				o = s[2],
				l = o.startsWith("$"),
				c = t.lineStart,
				d = [],
				f = c + a;
			d.push(u(e.TagMark, f, f + 1));
			const p = c + a + 1;
			let h, m;
			d.push(u(l ? e.WidgetName : e.TagName, p, p + o.length));
			let g, k = p + o.length;
			const x = e => {
					let t = 0;
					const n = e.length;
					for(; t < n;) {
						const r = e[t];
						if(">" === r) return {
							pos: t + 1,
							selfClose: !1
						};
						if("/" === r && ">" === e[t + 1]) return {
							pos: t + 2,
							selfClose: !0
						};
						if('"' === r || "'" === r) {
							const i = r;
							for(t++; t < n && e[t] !== i;) "\\" === e[t] && t++, t++;
							t++
						} else if("<" === r && "<" === e[t + 1]) {
							t += 2;
							let r = 1;
							for(; t < n && r > 0;) "<" === e[t] && "<" === e[t + 1] ? (r++, t += 2) : ">" === e[t] && ">" === e[t + 1] ? (r--, t += 2) : t++
						} else if("<" === r) {
							const n = e[t + 1];
							if(n && /[a-zA-Z$\/]/.test(n)) return null;
							t++
						} else if("{" === r && "{" === e[t + 1] && "{" === e[t + 2]) {
							for(t += 3; t < n && ("}" !== e[t] || "}" !== e[t + 1] || "}" !== e[t + 2]);) t++;
							t += 3
						} else if("{" === r && "{" === e[t + 1]) {
							for(t += 2; t < n && ("}" !== e[t] || "}" !== e[t + 1]);) t++;
							t += 2
						} else if("`" === r)
							if("```" === e.slice(t, t + 3)) {
								for(t += 3; t < n && "```" !== e.slice(t, t + 3);) t++;
								t += 3
							} else {
								for(t++; t < n && "`" !== e[t];) t++;
								t++
							}
						else t++
					}
					return null
				},
				b = r.slice(a + 1 + o.length);
			let y = x(b),
				w = b;
			const $ = t.savePosition();
			for(; !y && t.nextLine();) w += "\n" + t.line.text, y = x(w);
			if(y || t.restorePosition($), !y) {
				if(m = !1, h = c + r.length, g = h, b.trim()) {
					const e = Me(b, k);
					d.push(...e)
				}
				return t.addElement(u(l ? e.Widget : e.HTMLBlock, c, h, d)), !0
			} {
				m = y.selfClose, h = c + a + 1 + o.length + y.pos, g = t.lineStart + t.line.text.length;
				let n = w.slice(0, y.pos - 1);
				if(m && n.endsWith("/") && (n = n.slice(0, -1)), n.trim()) {
					const e = Me(n, k);
					d.push(...e)
				}
				m ? (d.push(u(e.SelfClosingMarker, h - 2, h - 1)), d.push(u(e.TagMark, h - 1, h))) : d.push(u(e.TagMark, h - 1, h))
			}
			if(!m) {
				const n = new RegExp(`<${o.replace(/\$/g,"\\$")}(?:\\s|>|/>)`),
					r = new RegExp(`</${o.replace(/\$/g,"\\$")}>`),
					i = new RegExp(`^(\\s*)</${o.replace(/\$/g,"\\$")}>`);
				let s = g,
					a = !1;
				const f = t.input.read(h, g),
					p = r.exec(f);
				if(p) {
					const i = f.slice(0, p.index),
						c = i.match(n) || [],
						m = i.match(new RegExp(r.source, "g")) || [];
					if(c.length === m.length) {
						const n = h,
							r = h + p.index;
						if(r > n) {
							const e = t.input.read(n, r),
								i = t.parser.parseInline(e, n);
							d.push(...i)
						}
						const i = h + p.index,
							c = h + p.index + p[0].length,
							m = [];
						m.push(u(e.TagMark, i, i + 1)), m.push(u(e.TagMark, i + 1, i + 2));
						const k = h + p.index + 2;
						m.push(u(l ? e.WidgetName : e.TagName, k, k + o.length)), m.push(u(e.TagMark, c - 1, c)), d.push(u(l ? e.WidgetEnd : e.HTMLEndTag, i, c, m));
						const x = f.slice(p.index + p[0].length);
						if(x.trim()) {
							const e = c,
								n = t.parser.parseInline(x, e);
							d.push(...n)
						}
						s = g, a = !0
					}
				}
				if(!a) {
					const r = t.input.read(h, g),
						c = g + 1;
					let f = c,
						p = 1;
					const m = t.savePosition();
					for(; t.nextLine();) {
						const m = t.line.text;
						n.exec(m) && !Le.test(m) && p++;
						const g = i.exec(m);
						if(g && (p--, 0 === p)) {
							if(f = t.lineStart - 1, r.trim()) {
								const e = t.parser.parseInline(r, h);
								d.push(...e)
							}
							if(f > c) {
								const e = t.parseContentRange(c, f, !1);
								d.push(...e)
							}
							const n = g[1].length,
								i = t.lineStart + n,
								p = g[0].length,
								k = t.lineStart + p,
								x = [];
							x.push(u(e.TagMark, i, i + 1)), x.push(u(e.TagMark, i + 1, i + 2));
							const b = t.lineStart + n + 2;
							x.push(u(l ? e.WidgetName : e.TagName, b, b + o.length)), x.push(u(e.TagMark, k - 1, k)), d.push(u(l ? e.WidgetEnd : e.HTMLEndTag, i, k, x));
							const y = m.slice(p);
							if(y.trim()) {
								const e = t.lineStart + p,
									n = t.parser.parseInline(y, e);
								d.push(...n)
							}
							s = t.lineStart + m.length, a = !0;
							break
						}
					}
					a || (t.restorePosition(m), s = g)
				}
				return t.addElement(u(l ? e.Widget : e.HTMLBlock, c, s, d)), !0
			}
			return t.addElement(u(l ? e.Widget : e.HTMLBlock, c, h, d)), !0
		}
	},
	Pe = /^@@(\.[a-zA-Z_][a-zA-Z0-9_\-]*)*\s*$/,
	Ee = {
		name: "StyledBlock",
		parse(t, n) {
			if(!Pe.exec(n.text)) return !1;
			const r = t.lineStart,
				i = [u(e.HighlightMark, r, r + 2)];
			let s = 2;
			for(; s < n.text.length;)
				if("." === n.text[s]) {
					const t = s;
					s++;
					const a = s;
					for(; s < n.text.length && /[a-zA-Z0-9_\-]/.test(n.text[s]);) s++;
					s > a && (i.push(u(e.StyledBlockMark, r + t, r + t + 1)), i.push(u(e.StyledBlockClass, r + a, r + s)))
				} else s++;
			const a = r + n.text.length;
			let o = t.lineStart + n.text.length + 1,
				l = o;
			for(; o < t.input.length;) {
				let n = o;
				for(; n < t.input.length && "\n" !== t.input.read(n, n + 1);) n++;
				const s = t.input.read(o, n);
				if("@@" === s.trim()) {
					if(l = o, l > a + 1) {
						const e = t.parseContentRange(a + 1, l);
						i.push(...e)
					}
					const c = o + s.indexOf("@@");
					for(i.push(u(e.HighlightMark, c, c + 2)), t.addElement(u(e.Highlight, r, n, i)); t.lineStart < o;) t.nextLine();
					return !0
				}
				o = n + 1
			}
			return !1
		}
	},
	Be = /^\s*<%\s*if\s+(.+?)\s*%>/,
	Ae = /^\s*<%\s*elseif\s+(.+?)\s*%>/,
	Ie = /^\s*<%\s*else\s*%>/,
	Fe = /^\s*<%\s*endif\s*%>/,
	Oe = [te, ie, {
		name: "ConditionalBlock",
		parse(t, n) {
			const r = Be.exec(n.text);
			if(!r) return !1;
			const i = t.lineStart,
				s = r[1],
				a = [],
				o = i + n.text.indexOf("<%"),
				l = i + n.text.indexOf("if");
			a.push(u(e.ConditionalMark, o, o + 2)), a.push(u(e.ConditionalKeyword, l, l + 2));
			const c = i + n.text.indexOf(s),
				d = we(s, c);
			a.push(u(e.FilterExpression, c, c + s.length, d));
			const f = i + n.text.indexOf("%>");
			a.push(u(e.ConditionalMark, f, f + 2));
			const p = i + n.text.length;
			let h = f + 2,
				m = h,
				g = 1,
				k = -1,
				x = -1;
			const b = n.text.slice(f + 2 - i),
				y = /<%\s*endif\s*%>/.exec(b);
			if(y) {
				const n = b.slice(0, y.index);
				if(n.trim()) {
					const r = f + 2,
						i = f + 2 + y.index,
						s = t.parser.parseInline(n, r);
					a.push(u(e.ConditionalBranch, r, i, s))
				}
				const r = f + 2 + y.index,
					s = f + 2 + b.indexOf("endif", y.index),
					o = f + 2 + b.indexOf("%>", y.index);
				return a.push(u(e.ConditionalMark, r, r + 2)), a.push(u(e.ConditionalKeyword, s, s + 5)), a.push(u(e.ConditionalMark, o, o + 2)), k = o + 2, t.addElement(u(e.ConditionalBlock, i, k, a)), !0
			}
			for(m = p + 1; m < t.input.length && g > 0;) {
				let n = m;
				for(; n < t.input.length && "\n" !== t.input.read(n, n + 1);) n++;
				const r = t.input.read(m, n);
				if(Be.test(r)) g++;
				else if(Fe.test(r)) {
					if(g--, 0 === g) {
						if(m > h) {
							const n = t.parseContentRange(h, m);
							n.length > 0 && a.push(u(e.ConditionalBranch, h, m, n))
						}
						const i = m + r.indexOf("<%"),
							s = m + r.indexOf("endif"),
							o = m + r.indexOf("%>");
						a.push(u(e.ConditionalMark, i, i + 2)), a.push(u(e.ConditionalKeyword, s, s + 5)), a.push(u(e.ConditionalMark, o, o + 2)), x = m, k = n;
						break
					}
				} else if(1 === g && Ae.test(r)) {
					if(m > h) {
						const n = t.parseContentRange(h, m);
						n.length > 0 && a.push(u(e.ConditionalBranch, h, m, n))
					}
					const i = Ae.exec(r);
					if(i) {
						const t = m + r.indexOf("<%"),
							n = m + r.indexOf("elseif");
						a.push(u(e.ConditionalMark, t, t + 2)), a.push(u(e.ConditionalKeyword, n, n + 6));
						const s = i[1],
							o = m + r.indexOf(s),
							l = we(s, o);
						a.push(u(e.FilterExpression, o, o + s.length, l)), a.push(u(e.ConditionalMark, m + r.indexOf("%>"), m + r.indexOf("%>") + 2))
					}
					h = n + 1
				} else if(1 === g && Ie.test(r)) {
					if(m > h) {
						const n = t.parseContentRange(h, m);
						n.length > 0 && a.push(u(e.ConditionalBranch, h, m, n))
					}
					const i = m + r.indexOf("<%"),
						s = m + r.indexOf("else"),
						o = m + r.indexOf("%>");
					a.push(u(e.ConditionalMark, i, i + 2)), a.push(u(e.ConditionalKeyword, s, s + 4)), a.push(u(e.ConditionalMark, o, o + 2)), h = n + 1
				}
				m = n + 1
			}
			if(-1 === k) {
				if(h <= t.input.length) {
					const n = t.parseContentRange(h, t.input.length);
					a.push(u(e.ConditionalBranch, h, t.input.length, n))
				}
				for(t.addElement(u(e.ConditionalBlock, i, t.input.length, a)); !t.atEnd;) t.nextLine();
				return !0
			}
			for(t.addElement(u(e.ConditionalBlock, i, k, a)); t.lineStart < x;) t.nextLine();
			return !0
		}
	}, Ee, G, X, ae, fe, de, me, xe, ye, $e, Te, ve],
	De = {
		name: "Escape",
		parse(n, r, i) {
			if(r !== t.Tilde && r !== t.Backslash) return -1;
			const s = n.char(i + 1);
			return s < 0 ? -1 : r === t.Tilde ? s >= 65 && s <= 90 ? n.addElement(n.elt(e.Escape, i, i + 1)) : -1 : n.addElement(n.elt(e.Escape, i, i + 2))
		}
	},
	Ne = /^&(?:#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/,
	He = {
		name: "Entity",
		parse(n, r, i) {
			if(r !== t.Ampersand) return -1;
			const s = n.slice(i, n.end),
				a = Ne.exec(s);
			return a ? n.addElement(n.elt(e.Entity, i, i + a[0].length)) : -1
		}
	},
	We = {
		name: "InlineCode",
		parse(n, r, i) {
			if(r !== t.Backtick) return -1;
			let s = i + 1;
			for(; s < n.end;) {
				if(n.char(s) === t.Backtick) return n.addElement(n.elt(e.InlineCode, i, s + 1, [n.elt(e.InlineCodeMark, i, i + 1), n.elt(e.CodeText, i + 1, s), n.elt(e.InlineCodeMark, s, s + 1)]));
				s++
			}
			const a = [n.elt(e.InlineCodeMark, i, i + 1)];
			return n.end > i + 1 && a.push(n.elt(e.CodeText, i + 1, n.end)), n.addElement(n.elt(e.InlineCode, i, n.end, a))
		}
	},
	Re = {
		name: "Bold",
		parse: U({
			charCode: t.Apostrophe,
			delimType: {
				resolve: "Bold",
				mark: "BoldMark"
			}
		})
	},
	_e = {
		name: "Italic",
		parse: U({
			charCode: t.Slash,
			delimType: {
				resolve: "Italic",
				mark: "ItalicMark"
			}
		})
	},
	ze = {
		name: "Underline",
		parse: U({
			charCode: t.Underscore,
			delimType: {
				resolve: "Underline",
				mark: "UnderlineMark"
			}
		})
	},
	Ve = {
		name: "Strikethrough",
		parse: U({
			charCode: t.Tilde,
			delimType: {
				resolve: "Strikethrough",
				mark: "StrikethroughMark"
			}
		})
	},
	Ze = {
		name: "Superscript",
		parse: U({
			charCode: t.Caret,
			delimType: {
				resolve: "Superscript",
				mark: "SuperscriptMark"
			}
		})
	},
	je = {
		name: "Subscript",
		parse: U({
			charCode: t.Comma,
			delimType: {
				resolve: "Subscript",
				mark: "SubscriptMark"
			}
		})
	},
	Ke = {
		name: "Highlight",
		parse(n, r, i) {
			if(r !== t.At || n.char(i + 1) !== t.At) return -1;
			const s = n.slice(i, n.end);
			let a = -1;
			for(let e = 2; e < s.length - 1; e++)
				if("@" === s[e] && "@" === s[e + 1]) {
					a = e;
					break
				} if(-1 === a) return -1;
			const o = i + a + 2,
				l = s.slice(2, a),
				c = [n.elt(e.HighlightMark, i, i + 2)];
			let d = 0,
				u = !1;
			for(; d < l.length && "." === l[d];) {
				u = !0;
				const t = d;
				d++;
				const r = d;
				for(; d < l.length && /[a-zA-Z0-9_\-]/.test(l[d]);) d++;
				d > r && (c.push(n.elt(e.StyledBlockMark, i + 2 + t, i + 2 + t + 1)), c.push(n.elt(e.StyledBlockClass, i + 2 + r, i + 2 + d)))
			}
			if(!u && l.includes(":") && l.includes(";")) {
				d = l.indexOf(";") + 1
			}
			if(d < l.length && /\s/.test(l[d]) && d++, d < a) {
				const e = l.slice(d),
					t = n.parser.parseInline(e, i + 2 + d);
				c.push(...t)
			}
			return c.push(n.elt(e.HighlightMark, o - 2, o)), n.addElement(n.elt(e.Highlight, i, o, c))
		}
	},
	Ue = /^\[\[([^\]|]*?)(?:\|([^\]]*?))?\]\]/,
	Qe = {
		name: "WikiLink",
		parse(n, r, i) {
			if(r !== t.LeftBracket || n.char(i + 1) !== t.LeftBracket) return -1;
			const s = n.slice(i, n.end),
				a = Ue.exec(s);
			if(!a) {
				const t = /^\[\[([^\]\n]*)$/.exec(s);
				if(t) {
					const r = i + t[0].length,
						s = t[1],
						a = [n.elt(e.WikiLinkMark, i, i + 2)],
						o = s.indexOf("|");
					return -1 !== o ? (a.push(n.elt(e.LinkText, i + 2, i + 2 + o)), a.push(n.elt(e.LinkSeparator, i + 2 + o, i + 3 + o)), s.length > o + 1 && a.push(n.elt(e.LinkTarget, i + 3 + o, r))) : s && a.push(n.elt(e.LinkTarget, i + 2, r)), n.addElement(n.elt(e.WikiLink, i, r, a))
				}
				return -1
			}
			const o = i + a[0].length,
				l = a[1],
				c = a[2],
				d = [n.elt(e.WikiLinkMark, i, i + 2)];
			return void 0 !== c ? (d.push(n.elt(e.LinkText, i + 2, i + 2 + l.length)), d.push(n.elt(e.LinkSeparator, i + 2 + l.length, i + 3 + l.length)), d.push(n.elt(e.LinkTarget, i + 3 + l.length, o - 2))) : d.push(n.elt(e.LinkTarget, i + 2, o - 2)), d.push(n.elt(e.WikiLinkMark, o - 2, o)), n.addElement(n.elt(e.WikiLink, i, o, d))
		}
	},
	qe = /^\[ext\[([^\]|]*?)(?:\|([^\]]*?))?\]\]/,
	Ge = {
		name: "ExternalLink",
		parse(n, r, i) {
			if(r !== t.LeftBracket) return -1;
			const s = n.slice(i, n.end),
				a = qe.exec(s);
			if(!a) {
				const t = /^\[ext\[([^\]\n]*)$/.exec(s);
				if(t) {
					const r = i + t[0].length,
						s = t[1],
						a = [n.elt(e.ExtLinkMark, i, i + 5)],
						o = s.indexOf("|");
					return -1 !== o ? (a.push(n.elt(e.LinkText, i + 5, i + 5 + o)), a.push(n.elt(e.LinkSeparator, i + 5 + o, i + 6 + o)), s.length > o + 1 && a.push(n.elt(e.URLLink, i + 6 + o, r))) : s && a.push(n.elt(e.URLLink, i + 5, r)), n.addElement(n.elt(e.ExternalLink, i, r, a))
				}
				return -1
			}
			const o = i + a[0].length,
				l = a[1],
				c = a[2],
				d = [n.elt(e.ExtLinkMark, i, i + 5)];
			return void 0 !== c ? (d.push(n.elt(e.LinkText, i + 5, i + 5 + l.length)), d.push(n.elt(e.LinkSeparator, i + 5 + l.length, i + 6 + l.length)), d.push(n.elt(e.URLLink, i + 6 + l.length, o - 2))) : d.push(n.elt(e.URLLink, i + 5, o - 2)), d.push(n.elt(e.ExtLinkMark, o - 2, o)), n.addElement(n.elt(e.ExternalLink, i, o, d))
		}
	},
	Je = /^\[img(\s+[^\[]+)?\[([^\]|]*?)(?:\|([^\]]*?))?\]\]/,
	Xe = {
		name: "ImageLink",
		parse(n, r, i) {
			if(r !== t.LeftBracket) return -1;
			const s = n.slice(i, n.end),
				a = Je.exec(s);
			if(!a) {
				const t = /^\[img(\s+[^\[\n]+)?\[([^\]\n]*)$/.exec(s);
				if(t) {
					const r = i + t[0].length,
						s = t[1],
						a = t[2],
						o = [n.elt(e.ImageMark, i, i + 4)];
					let l = i + 4;
					if(s) {
						const e = i + 4;
						l = e + s.length;
						const t = st(n, s.trim(), e + (s.length - s.trimStart().length));
						o.push(...t)
					}
					if(o.push(n.elt(e.ImageMark, l, l + 1)), a) {
						const t = l + 1,
							i = a.indexOf("|"); - 1 !== i ? (o.push(n.elt(e.ImageTooltip, t, t + i)), o.push(n.elt(e.LinkSeparator, t + i, t + i + 1)), a.length > i + 1 && o.push(n.elt(e.ImageSource, t + i + 1, r))) : o.push(n.elt(e.ImageSource, t, r))
					}
					return n.addElement(n.elt(e.ImageLink, i, r, o))
				}
				return -1
			}
			const o = i + a[0].length,
				l = a[1],
				c = a[2],
				d = a[3],
				u = [n.elt(e.ImageMark, i, i + 4)];
			let f = i + 4;
			if(l) {
				const e = i + 4;
				f = e + l.length;
				const t = st(n, l.trim(), e + (l.length - l.trimStart().length));
				u.push(...t)
			}
			const p = f;
			u.push(n.elt(e.ImageMark, p, p + 1));
			const h = p + 1;
			if(void 0 !== d) {
				const t = h + c.length;
				c && u.push(n.elt(e.ImageTooltip, h, t)), u.push(n.elt(e.LinkSeparator, t, t + 1));
				const r = t + 1,
					i = r + d.length;
				d && u.push(n.elt(e.ImageSource, r, i))
			} else {
				const t = h + c.length;
				c && u.push(n.elt(e.ImageSource, h, t))
			}
			return u.push(n.elt(e.ImageMark, o - 2, o)), n.addElement(n.elt(e.ImageLink, i, o, u))
		}
	},
	Ye = /^\{\{([^{}|]*?)(?:\|\|([^{}|]+?))?(?:\|([^{}]+?))?\}\}/,
	et = {
		name: "Transclusion",
		parse(n, r, i) {
			if(r !== t.LeftBrace || n.char(i + 1) !== t.LeftBrace) return -1;
			if(n.char(i + 2) === t.LeftBrace) return -1;
			const s = n.slice(i, n.end),
				a = Ye.exec(s);
			if(!a) {
				const t = /^\{\{([^{}\n~'^/_`<\[]*?)(?=~~|''|\/\/|^^|,,|``|<<|__|$)/.exec(s);
				if(t && t[0].length > 2) {
					const r = i + t[0].length,
						s = t[1],
						a = [n.elt(e.TransclusionMark, i, i + 2)];
					if(s) {
						const e = Q(s, i + 2);
						a.push(...e)
					}
					return n.addElement(n.elt(e.Transclusion, i, r, a))
				}
				return -1
			}
			const o = i + a[0].length,
				l = a[1],
				c = a[2],
				d = [n.elt(e.TransclusionMark, i, i + 2)],
				u = Q(l, i + 2);
			if(d.push(...u), c) {
				const t = i + 2 + l.length + 2;
				d.push(n.elt(e.TransclusionTemplate, t, t + c.length))
			}
			return d.push(n.elt(e.TransclusionMark, o - 2, o)), n.addElement(n.elt(e.Transclusion, i, o, d))
		}
	};

function tt(t, n, r) {
	const i = [];
	let s = 0;
	const a = n.length;
	for(; s < a;) {
		const o = n[s];
		if(/\s/.test(o)) s++;
		else {
			if("[" === o) {
				const o = s;
				s++;
				const l = [];
				for(; s < a && "]" !== n[s];) {
					"!" === n[s] && s++;
					const i = n[s];
					if("[" === i) {
						s++;
						const i = s;
						let o = 1;
						for(; s < a && o > 0;) "[" === n[s] ? o++ : "]" === n[s] && o--, o > 0 && s++;
						l.push(t.elt(e.FilterOperand, r + i, r + s)), s < a && "]" === n[s] && s++
					} else if("<" === i) {
						s++;
						const i = s;
						for(; s < a && ">" !== n[s];) s++;
						const o = n.slice(i, s),
							c = /^__([^_]+)__$/.exec(o);
						if(c) {
							const n = c[1],
								a = r + i - 1,
								o = r + s + 1,
								d = r + i,
								u = [t.elt(e.SubstitutedParamMark, d, d + 2), t.elt(e.SubstitutedParamName, d + 2, d + 2 + n.length), t.elt(e.SubstitutedParamMark, d + 2 + n.length, r + s)];
							l.push(t.elt(e.SubstitutedParam, a, o, u))
						} else l.push(t.elt(e.FilterVariable, r + i, r + s));
						s < a && s++
					} else if("{" === i) {
						s++;
						const i = s;
						for(; s < a && "}" !== n[s];) s++;
						l.push(t.elt(e.FilterTextRef, r + i, r + s)), s < a && s++
					} else if("/" === i) {
						s++;
						const i = s;
						for(; s < a && "/" !== n[s];) "\\" === n[s] && s++, s++;
						for(l.push(t.elt(e.FilterRegexp, r + i, r + s)), s < a && s++; s < a && /[gimsuy]/.test(n[s]);) s++
					} else if(/[a-zA-Z]/.test(i)) {
						const i = s;
						for(; s < a && /[a-zA-Z0-9\-_:!]/.test(n[s]);) s++;
						l.push(t.elt(e.FilterOperatorName, r + i, r + s))
					} else s++
				}
				s < a && "]" === n[s] && s++;
				const c = s;
				i.push(t.elt(e.FilterOperator, r + o, r + c, l));
				continue
			}
			if("[" === o && "[" === n[s + 1]) {
				const o = s;
				for(s += 2; s < a && ("]" !== n[s] || "]" !== n[s + 1]);) s++;
				s += 2, i.push(t.elt(e.FilterOperand, r + o, r + s));
				continue
			}
			if("+" !== o && "-" !== o && "~" !== o && ":" !== o) s++;
			else
				for(s++; s < a && /[a-zA-Z]/.test(n[s]);) s++
		}
	}
	return i
}
const nt = {
		name: "FilteredTransclusion",
		parse(n, r, i) {
			if(r !== t.LeftBrace || n.char(i + 1) !== t.LeftBrace || n.char(i + 2) !== t.LeftBrace) return -1;
			const s = n.slice(i, n.end);
			let a = -1;
			for(let e = 3; e < s.length - 2; e++)
				if("}" === s[e] && "}" === s[e + 1] && "}" === s[e + 2]) {
					a = e;
					break
				} if(-1 === a) {
				const t = /^\{\{\{([^\n~'^/_`<\[]*?)(?=~~|''|\/\/|^^|,,|``|<<|__|$)/.exec(s);
				if(t && t[0].length > 3) {
					const r = i + t[0].length,
						s = t[1],
						a = tt(n, s, i + 3),
						o = [n.elt(e.FilteredTransclusionMark, i, i + 3)];
					return s && o.push(n.elt(e.FilterExpression, i + 3, r, a)), n.addElement(n.elt(e.FilteredTransclusion, i, r, o))
				}
				return -1
			}
			const o = s.slice(3, a);
			let l = i + a + 3,
				c = "";
			if("||" === s.slice(a + 3, a + 5)) {
				const e = a + 5;
				let t = e;
				for(; t < s.length && !/[\s}]/.test(s[t]);) t++;
				c = s.slice(e, t), l = i + t
			}
			const d = tt(n, o, i + 3),
				u = [n.elt(e.FilteredTransclusionMark, i, i + 3), n.elt(e.FilterExpression, i + 3, i + 3 + o.length, d), n.elt(e.FilteredTransclusionMark, i + 3 + o.length, i + a + 3)];
			return c && u.push(n.elt(e.TransclusionTemplate, i + a + 5, l)), n.addElement(n.elt(e.FilteredTransclusion, i, l, u))
		}
	},
	rt = {
		name: "MacroCall",
		parse(n, r, i) {
			if(r !== t.LessThan || n.char(i + 1) !== t.LessThan) return -1;
			if(n.char(i + 2) === t.LessThan) return -1;
			const s = n.slice(i, n.end),
				a = s.length - 1;
			let o = -1,
				l = 1,
				c = -1;
			for(let e = 2; e < a; e++)
				if(-1 === c && "\n" === s[e] && (c = e), "<" === s[e] && "<" === s[e + 1]) l++, e++;
				else if(">" === s[e] && ">" === s[e + 1]) {
				if(l--, 0 === l) {
					o = e;
					break
				}
				e++
			}
			const d = -1 === o;
			if(d) {
				o = -1 === c ? s.length : c;
				let e = 2;
				for(; e < o && !/[\s\n>]/.test(s[e]);) e++;
				if(2 === e) return -1
			}
			const u = i + o + (d ? 0 : 2);
			if(u <= i || u > n.end) return -1;
			let f = 2;
			for(; f < o && !/[\s>]/.test(s[f]);) f++;
			const p = s.slice(2, f);
			if(!p) return -1;
			const h = [n.elt(e.MacroCallMark, i, i + 2)],
				m = /^__([^_]+)__$/.exec(p);
			if(m) {
				const t = m[1],
					r = i + 2,
					s = [n.elt(e.SubstitutedParamMark, r, r + 2), n.elt(e.SubstitutedParamName, r + 2, r + 2 + t.length), n.elt(e.SubstitutedParamMark, r + 2 + t.length, r + p.length)];
				h.push(n.elt(e.SubstitutedParam, r, r + p.length, s))
			} else h.push(n.elt(e.MacroName, i + 2, i + 2 + p.length));
			if(f < o) {
				const e = s.slice(f, o);
				if(e.trim()) {
					const t = q(e, i + f);
					h.push(...t)
				}
			}
			return d || h.push(n.elt(e.MacroCallMark, u - 2, u)), n.addElement(n.elt(e.MacroCall, i, u, h))
		}
	};

function it(e) {
	let t = 0;
	const n = e.length;
	for(; t < n;) {
		const r = e[t];
		if(">" === r) return {
			end: t + 1,
			selfClose: !1
		};
		if("/" === r && ">" === e[t + 1]) return {
			end: t + 2,
			selfClose: !0
		};
		if('"' === r || "'" === r) {
			const i = r;
			for(t++; t < n && e[t] !== i;) "\\" === e[t] && t++, t++;
			t++
		} else if("<" === r && "<" === e[t + 1]) {
			t += 2;
			let r = 1;
			for(; t < n && r > 0;) "<" === e[t] && "<" === e[t + 1] ? (r++, t += 2) : ">" === e[t] && ">" === e[t + 1] ? (r--, t += 2) : t++
		} else if("{" === r && "{" === e[t + 1] && "{" === e[t + 2]) {
			for(t += 3; t < n && ("}" !== e[t] || "}" !== e[t + 1] || "}" !== e[t + 2]);) t++;
			t += 3
		} else if("{" === r && "{" === e[t + 1]) {
			for(t += 2; t < n && ("}" !== e[t] || "}" !== e[t + 1]);) t++;
			t += 2
		} else if("`" === r)
			if("```" === e.slice(t, t + 3)) {
				for(t += 3; t < n && "```" !== e.slice(t, t + 3);) t++;
				t += 3
			} else {
				for(t++; t < n && "`" !== e[t];) t++;
				t++
			}
		else t++
	}
	return null
}

function st(t, n, r) {
	const i = [];
	let s = 0;
	const a = n.length;
	for(; s < a;) {
		for(; s < a && /\s/.test(n[s]);) s++;
		if(s >= a) break;
		const o = s;
		for(; s < a && /[a-zA-Z0-9\-_:.$]/.test(n[s]);) s++;
		if(s === o) {
			s++;
			continue
		}
		const l = s;
		for(; s < a && /\s/.test(n[s]);) s++;
		if(s >= a || "=" !== n[s]) {
			const n = [t.elt(e.AttributeName, r + o, r + l)];
			i.push(t.elt(e.Attribute, r + o, r + l, n));
			continue
		}
		for(s++; s < a && /\s/.test(n[s]);) s++;
		if(s >= a) {
			const n = [t.elt(e.AttributeName, r + o, r + l)];
			i.push(t.elt(e.Attribute, r + o, r + s, n));
			continue
		}
		const c = s;
		let d = s,
			u = e.AttributeValue;
		const f = n[s];
		if('"' === f && '"""' === n.slice(s, s + 3)) {
			for(s += 3; s < a && '"""' !== n.slice(s, s + 3);) s++;
			'"""' === n.slice(s, s + 3) && (s += 3), d = s, u = e.AttributeString;
			const f = [t.elt(e.AttributeName, r + o, r + l), t.elt(u, r + c, r + d)];
			i.push(t.elt(e.Attribute, r + o, r + d, f));
			continue
		}
		if('"' === f || "'" === f) {
			const p = f,
				h = s + 1;
			for(s++; s < a && n[s] !== p;) "\\" === n[s] && s + 1 < a && s++, s++;
			const m = s;
			s < a && s++, d = s, u = e.AttributeString;
			const g = n.slice(o, l).toLowerCase();
			if("filter" === g || "$filter" === g) {
				const s = tt(t, n.slice(h, m), r + h),
					a = [t.elt(e.Mark, r + c, r + h), t.elt(e.FilterExpression, r + h, r + m, s), t.elt(e.Mark, r + m, r + d)],
					u = [t.elt(e.AttributeName, r + o, r + l), t.elt(e.AttributeFiltered, r + c, r + d, a)];
				i.push(t.elt(e.Attribute, r + o, r + d, u));
				continue
			}
		} else if("{" === f) {
			if("{{{" === n.slice(s, s + 3)) {
				const f = s;
				s += 3;
				const p = s;
				for(; s < a && "}}}" !== n.slice(s, s + 3);) s++;
				const h = s;
				"}}}" === n.slice(s, s + 3) && (s += 3), d = s, u = e.AttributeFiltered;
				const m = tt(t, n.slice(p, h), r + p),
					g = [t.elt(e.FilteredTransclusionMark, r + f, r + f + 3), t.elt(e.FilterExpression, r + p, r + h, m), t.elt(e.FilteredTransclusionMark, r + h, r + d)],
					k = [t.elt(e.AttributeName, r + o, r + l), t.elt(u, r + c, r + d, g)];
				i.push(t.elt(e.Attribute, r + o, r + d, k));
				continue
			}
			if("{{" === n.slice(s, s + 2)) {
				const f = s;
				s += 2;
				const p = s;
				for(; s < a && "}}" !== n.slice(s, s + 2);) s++;
				const h = s;
				"}}" === n.slice(s, s + 2) && (s += 2), d = s, u = e.AttributeIndirect;
				const m = Q(n.slice(p, h), r + p),
					g = [t.elt(e.TransclusionMark, r + f, r + f + 2), ...m, t.elt(e.TransclusionMark, r + h, r + d)],
					k = [t.elt(e.AttributeName, r + o, r + l), t.elt(u, r + c, r + d, g)];
				i.push(t.elt(e.Attribute, r + o, r + d, k));
				continue
			}
			for(; s < a && !/[\s>]/.test(n[s]);) s++;
			d = s
		} else {
			if("<" === f && "<" === n[s + 1]) {
				const f = s;
				s += 2;
				const p = s;
				for(; s < a && /[a-zA-Z0-9\-_.$]/.test(n[s]);) s++;
				const h = s;
				let m = 1;
				for(; s < a && m > 0;)
					if("<<" === n.slice(s, s + 2)) m++, s += 2;
					else if(">>" === n.slice(s, s + 2)) {
					if(m--, 0 === m) break;
					s += 2
				} else s++;
				const g = s;
				">>" === n.slice(s, s + 2) && (s += 2), d = s, u = e.AttributeMacro;
				const k = [t.elt(e.MacroCallMark, r + f, r + f + 2), t.elt(e.MacroName, r + p, r + h), t.elt(e.MacroCallMark, r + g, r + d)],
					x = [t.elt(e.AttributeName, r + o, r + l), t.elt(u, r + c, r + d, k)];
				i.push(t.elt(e.Attribute, r + o, r + d, x));
				continue
			}
			if("`" === f) {
				let f, p;
				if("```" === n.slice(s, s + 3)) {
					for(f = s + 3, s += 3; s < a && "```" !== n.slice(s, s + 3);) s++;
					p = s, "```" === n.slice(s, s + 3) && (s += 3)
				} else {
					for(f = s + 1, s++; s < a && "`" !== n[s];) s++;
					p = s, s < a && s++
				}
				d = s, u = e.AttributeSubstituted;
				const h = [t.elt(e.Mark, r + c, r + f)],
					m = n.slice(f, p);
				let g = 0;
				const k = r + f;
				for(; g < m.length;) {
					if("${" === m.slice(g, g + 2)) {
						let n = -1;
						for(let e = g + 2; e < m.length - 1; e++)
							if("}" === m[e] && "$" === m[e + 1]) {
								n = e;
								break
							} if(-1 !== n) {
							const r = [m.slice(g, n + 2), m.slice(g + 2, n)],
								i = k + g,
								s = i + r[0].length,
								a = i + 2,
								o = s - 2,
								l = tt(t, r[1].trim(), a + (r[1].length - r[1].trimStart().length));
							h.push(t.elt(e.FilterSubstitution, i, s, [t.elt(e.FilterSubstitutionMark, i, i + 2), t.elt(e.FilterExpression, a, o, l), t.elt(e.FilterSubstitutionMark, s - 2, s)])), g += r[0].length;
							continue
						}
					}
					const n = m.slice(g).match(/^\$\(([^)]+)\)\$/);
					if(n) {
						const r = k + g,
							i = r + n[0].length,
							s = r + 2,
							a = s + n[1].length;
						h.push(t.elt(e.Variable, r, i, [t.elt(e.VariableMark, r, r + 2), t.elt(e.VariableName, s, a), t.elt(e.VariableMark, a, i)])), g += n[0].length
					} else g++
				}
				h.push(t.elt(e.Mark, r + p, r + d));
				const x = [t.elt(e.AttributeName, r + o, r + l), t.elt(u, r + c, r + d, h)];
				i.push(t.elt(e.Attribute, r + o, r + d, x));
				continue
			} {
				for(; s < a && !/[\s>\/]/.test(n[s]);) s++;
				d = s;
				const t = n.slice(c, d);
				u = /^-?\d+(\.\d+)?$/.test(t) ? e.AttributeNumber : e.AttributeString
			}
		}
		const p = [t.elt(e.AttributeName, r + o, r + l), t.elt(u, r + c, r + d)];
		i.push(t.elt(e.Attribute, r + o, r + d, p))
	}
	return i
}
const at = /^<(\$[a-zA-Z0-9\-\.]*)/,
	ot = {
		name: "Widget",
		parse(n, r, i) {
			if(r !== t.LessThan) return -1;
			if(n.char(i + 1) !== t.Dollar) return -1;
			const s = n.slice(i, n.end),
				a = at.exec(s);
			if(!a) return -1;
			const o = a[1],
				l = a[0].length,
				c = it(s.slice(l));
			if(!c) {
				const t = s.slice(l),
					r = [n.elt(e.TagMark, i, i + 1), n.elt(e.WidgetName, i + 1, i + 1 + o.length)];
				if(t.trim()) {
					const e = st(n, t, i + l);
					r.push(...e)
				}
				return n.addElement(n.elt(e.InlineWidget, i, n.end, r))
			}
			const d = i + l + c.end,
				u = s.slice(l, l + c.end - (c.selfClose ? 2 : 1)),
				f = [n.elt(e.TagMark, i, i + 1), n.elt(e.WidgetName, i + 1, i + 1 + o.length)];
			if(u.trim()) {
				const e = st(n, u, i + l);
				f.push(...e)
			}
			if(c.selfClose) return f.push(n.elt(e.SelfClosingMarker, d - 2, d - 1)), f.push(n.elt(e.TagMark, d - 1, d)), n.addElement(n.elt(e.InlineWidget, i, d, f));
			f.push(n.elt(e.TagMark, d - 1, d));
			const p = `</${o}>`,
				h = s.slice(l + c.end).indexOf(p);
			if(-1 === h) return n.addElement(n.elt(e.InlineWidget, i, d, f));
			const m = d,
				g = d + h,
				k = n.slice(m, g);
			if(k.length > 0) {
				const e = n.parser.parseInline(k, m);
				f.push(...e)
			}
			const x = g,
				b = x + p.length,
				y = [n.elt(e.TagMark, x, x + 2), n.elt(e.WidgetName, x + 2, b - 1), n.elt(e.TagMark, b - 1, b)];
			return f.push(n.elt(e.WidgetEnd, x, b, y)), n.addElement(n.elt(e.InlineWidget, i, b, f))
		}
	},
	lt = /^<([a-zA-Z][a-zA-Z0-9\-]*)/,
	ct = {
		name: "HTMLTag",
		parse(n, r, i) {
			if(r !== t.LessThan) return -1;
			if(n.char(i + 1) === t.Dollar) return -1;
			const s = n.slice(i, n.end),
				a = lt.exec(s);
			if(!a) return -1;
			const o = a[1],
				l = a[0].length,
				c = it(s.slice(l));
			if(!c) {
				const t = s.slice(l),
					r = [n.elt(e.TagMark, i, i + 1), n.elt(e.TagName, i + 1, i + 1 + o.length)];
				if(t.trim()) {
					const e = st(n, t, i + l);
					r.push(...e)
				}
				return n.addElement(n.elt(e.HTMLTag, i, n.end, r))
			}
			const d = i + l + c.end,
				u = s.slice(l, l + c.end - (c.selfClose ? 2 : 1)),
				f = [n.elt(e.TagMark, i, i + 1), n.elt(e.TagName, i + 1, i + 1 + o.length)];
			if(u.trim()) {
				const e = st(n, u, i + l);
				f.push(...e)
			}
			if(c.selfClose) return f.push(n.elt(e.SelfClosingMarker, d - 2, d - 1)), f.push(n.elt(e.TagMark, d - 1, d)), n.addElement(n.elt(e.HTMLTag, i, d, f));
			f.push(n.elt(e.TagMark, d - 1, d));
			const p = `</${o}>`,
				h = s.slice(l + c.end).indexOf(p);
			if(-1 === h) return n.addElement(n.elt(e.HTMLTag, i, d, f));
			const m = d,
				g = d + h,
				k = n.slice(m, g);
			if(k.length > 0) {
				const e = n.parser.parseInline(k, m);
				f.push(...e)
			}
			const x = g,
				b = x + p.length,
				y = [n.elt(e.TagMark, x, x + 2), n.elt(e.TagName, x + 2, b - 1), n.elt(e.TagMark, b - 1, b)];
			return f.push(n.elt(e.HTMLEndTag, x, b, y)), n.addElement(n.elt(e.HTMLTag, i, b, f))
		}
	},
	dt = {
		name: "InlineComment",
		parse(n, r, i) {
			if(r !== t.LessThan) return -1;
			if(33 !== n.char(i + 1)) return -1;
			if(n.char(i + 2) !== t.Dash) return -1;
			if(n.char(i + 3) !== t.Dash) return -1;
			let s = i + 4;
			for(; s < n.end - 2;) {
				if(n.char(s) === t.Dash && n.char(s + 1) === t.Dash && 62 === n.char(s + 2)) {
					const t = s + 3;
					return n.addElement(n.elt(e.CommentBlock, i, t, [n.elt(e.CommentMarker, i, i + 4), n.elt(e.CommentMarker, t - 3, t)]))
				}
				s++
			}
			return -1
		}
	},
	ut = {
		name: "Dash",
		parse(n, r, i) {
			if(r !== t.Dash) return -1;
			let s = 1;
			for(; n.char(i + s) === t.Dash;) s++;
			return 2 === s ? n.addElement(n.elt(e.Dash, i, i + 2)) : s >= 3 ? n.addElement(n.elt(e.Dash, i, i + 3)) : -1
		}
	},
	ft = /^\$\(([^)]+)\)\$/,
	pt = {
		name: "VariableSubstitution",
		parse(n, r, i) {
			if(r !== t.Dollar) return -1;
			if(40 !== n.char(i + 1)) return -1;
			const s = n.slice(i, n.end),
				a = ft.exec(s);
			if(!a) return -1;
			const o = i + a[0].length,
				l = i + 2,
				c = l + a[1].length,
				d = [n.elt(e.VariableMark, i, i + 2), n.elt(e.VariableName, l, c), n.elt(e.VariableMark, c, o)];
			return n.addElement(n.elt(e.Variable, i, o, d))
		}
	},
	ht = /^\$([a-zA-Z][a-zA-Z0-9\-_]*)\$/,
	mt = {
		name: "PlaceholderParam",
		parse(n, r, i) {
			if(r !== t.Dollar) return -1;
			const s = n.slice(i, n.end),
				a = ht.exec(s);
			if(!a) return -1;
			const o = i + a[0].length,
				l = i + 1,
				c = l + a[1].length,
				d = [n.elt(e.PlaceholderMark, i, i + 1), n.elt(e.VariableName, l, c), n.elt(e.PlaceholderMark, c, o)];
			return n.addElement(n.elt(e.Placeholder, i, o, d))
		}
	},
	gt = /^[A-Z][a-z]+[A-Z][A-Za-z]*/,
	kt = {
		name: "CamelCaseLink",
		parse(n, r, i) {
			if(r < 65 || r > 90) return -1;
			if(i > n.offset) {
				const e = n.char(i - 1);
				if(e >= 65 && e <= 90 || e >= 97 && e <= 122) return -1;
				if(e === t.Tilde) return -1
			}
			const s = n.slice(i, n.end),
				a = gt.exec(s);
			return a ? n.addElement(n.elt(e.CamelCaseLink, i, i + a[0].length)) : -1
		}
	},
	xt = /^\$:\/[^\s\[\]{}|]*/,
	bt = /[.,;:!?'")\]]+$/,
	yt = {
		name: "SystemLink",
		parse(n, r, i) {
			if(r !== t.Dollar) return -1;
			const s = n.slice(i, n.end),
				a = xt.exec(s);
			if(!a) return -1;
			let o = a[0];
			return o = o.replace(bt, ""), o.length <= 3 ? -1 : n.addElement(n.elt(e.SystemLink, i, i + o.length))
		}
	},
	wt = /^(?:https?|ftp|file):\/\/[^\s\[\]{}|<>]*/i,
	$t = /^(?:mailto|tel|geo|data|javascript):[^\s\[\]{}|<>]+/i,
	Tt = {
		name: "URLAutoLink",
		parse(t, n, r) {
			if(104 !== n && 102 !== n && 109 !== n && 116 !== n && 103 !== n && 100 !== n && 106 !== n) return -1;
			const i = t.slice(r, t.end);
			let s = wt.exec(i),
				a = 8;
			if(s || (s = $t.exec(i), a = 7), !s) return -1;
			let o = s[0];
			return o = o.replace(bt, ""), o.length <= a ? -1 : t.addElement(t.elt(e.URLLink, r, r + o.length))
		}
	},
	Mt = [We, {
		name: "ConditionalSyntax",
		parse(n, r, i) {
			if(r !== t.LessThan) return -1;
			if(n.char(i + 1) !== t.Percent) return -1;
			const s = n.slice(i, n.end),
				a = [];
			a.push(n.elt(e.ConditionalMark, i, i + 2));
			const o = /^<%\s*(if|elseif|else|endif)\b/.exec(s);
			if(o) {
				const t = o[1],
					r = i + s.indexOf(t, 2),
					l = r + t.length;
				if(a.push(n.elt(e.ConditionalKeyword, r, l)), "if" === t || "elseif" === t) {
					const t = s.slice(l - i),
						r = /^\s+(.+?)(?:\s*%>|$)/.exec(t);
					if(r) {
						const i = r[1],
							s = l + t.indexOf(i),
							o = s + i.length,
							c = tt(n, i, s);
						a.push(n.elt(e.FilterExpression, s, o, c))
					}
				}
				const c = s.indexOf("%>");
				return -1 !== c ? (a.push(n.elt(e.ConditionalMark, i + c, i + c + 2)), n.addElement(n.elt(e.Conditional, i, i + c + 2, a))) : n.addElement(n.elt(e.Conditional, i, l, a))
			}
			const l = s.indexOf("%>");
			return -1 !== l && l > 2 ? (a.push(n.elt(e.ConditionalMark, i + l, i + l + 2)), n.addElement(n.elt(e.Conditional, i, i + l + 2, a))) : n.addElement(n.elt(e.ConditionalMark, i, i + 2))
		}
	}, De, He, Re, _e, ze, Ve, Ze, je, Ke, Qe, Ge, Xe, nt, et, rt, ot, dt, ct, ut, pt, yt, mt, kt, Tt],
	St = {
		twTransclusion: s.Tag.define(),
		twMacro: s.Tag.define(),
		twWidget: s.Tag.define(),
		twFilter: s.Tag.define(),
		twPragma: s.Tag.define(),
		twVariable: s.Tag.define(),
		twSuperscript: s.Tag.define(),
		twSubscript: s.Tag.define()
	},
	Ct = s.styleTags({
		"Heading1/...": s.tags.heading1,
		"Heading2/...": s.tags.heading2,
		"Heading3/...": s.tags.heading3,
		"Heading4/...": s.tags.heading4,
		"Heading5/...": s.tags.heading5,
		"Heading6/...": s.tags.heading6,
		HeadingMark: s.tags.processingInstruction,
		"Bold/...": s.tags.strong,
		"Italic/...": s.tags.emphasis,
		"Underline/...": s.tags.special(s.tags.emphasis),
		"Strikethrough/...": s.tags.strikethrough,
		"Superscript/...": St.twSuperscript,
		"Subscript/...": St.twSubscript,
		"Highlight/...": s.tags.special(s.tags.content),
		"BoldMark ItalicMark UnderlineMark StrikethroughMark SuperscriptMark SubscriptMark HighlightMark": s.tags.processingInstruction,
		"InlineCode FencedCode TypedBlock CodeText": s.tags.monospace,
		"CodeMark TypedBlockMark InlineCodeMark": s.tags.processingInstruction,
		CodeInfo: s.tags.labelName,
		TypedBlockType: s.tags.labelName,
		"WikiLink ExternalLink CamelCaseLink": s.tags.link,
		"WikiLinkMark ExtLinkMark": s.tags.processingInstruction,
		LinkText: s.tags.string,
		LinkTarget: s.tags.url,
		LinkSeparator: s.tags.processingInstruction,
		ImageLink: s.tags.link,
		ImageMark: s.tags.processingInstruction,
		ImageSource: s.tags.url,
		ImageTooltip: s.tags.string,
		"URLLink SystemLink": s.tags.url,
		"Transclusion TransclusionBlock": s.tags.special(s.tags.link),
		TransclusionMark: s.tags.processingInstruction,
		TransclusionTarget: s.tags.special(s.tags.string),
		TransclusionTemplate: s.tags.special(s.tags.string),
		TransclusionField: s.tags.propertyName,
		TransclusionIndex: s.tags.propertyName,
		"FilteredTransclusion FilteredTransclusionBlock": s.tags.special(s.tags.link),
		FilteredTransclusionMark: s.tags.processingInstruction,
		FilterExpression: s.tags.special(s.tags.string),
		"MacroCall MacroCallBlock": s.tags.macroName,
		MacroCallMark: s.tags.processingInstruction,
		MacroName: s.tags.macroName,
		MacroParam: s.tags.attributeValue,
		MacroParamName: s.tags.attributeName,
		MacroParamValue: s.tags.attributeValue,
		"Widget InlineWidget HTMLBlock HTMLTag": s.tags.tagName,
		WidgetName: s.tags.tagName,
		TagName: s.tags.tagName,
		Attribute: s.tags.attributeName,
		AttributeName: s.tags.attributeName,
		"AttributeValue AttributeString": s.tags.attributeValue,
		AttributeNumber: s.tags.number,
		AttributeIndirect: s.tags.special(s.tags.link),
		AttributeFiltered: s.tags.special(s.tags.link),
		AttributeMacro: s.tags.macroName,
		AttributeSubstituted: s.tags.special(s.tags.string),
		SelfClosingMarker: s.tags.processingInstruction,
		"BulletList OrderedList DefinitionList": s.tags.list,
		"ListItem DefinitionTerm DefinitionDescription": s.tags.list,
		ListMark: s.tags.processingInstruction,
		BlockQuote: s.tags.quote,
		QuoteMark: s.tags.processingInstruction,
		BlockQuoteClass: s.tags.className,
		"Table TableRow": s.tags.content,
		"TableHeader TableHeaderCell": s.tags.heading,
		TableCell: s.tags.content,
		TableDelimiter: s.tags.processingInstruction,
		HorizontalRule: s.tags.contentSeparator,
		"CommentBlock CommentMarker": s.tags.comment,
		PragmaMark: s.tags.processingInstruction,
		PragmaKeyword: s.tags.keyword,
		PragmaName: s.tags.definition(s.tags.macroName),
		PragmaParams: s.tags.definition(s.tags.variableName),
		PragmaBody: s.tags.content,
		PragmaEnd: s.tags.keyword,
		Escape: s.tags.escape,
		Entity: s.tags.character,
		Dash: s.tags.punctuation,
		Variable: s.tags.special(s.tags.variableName),
		VariableMark: s.tags.processingInstruction,
		VariableName: s.tags.variableName,
		FilterSubstitution: s.tags.special(s.tags.string),
		FilterSubstitutionMark: s.tags.processingInstruction,
		Placeholder: s.tags.special(s.tags.variableName),
		PlaceholderMark: s.tags.processingInstruction,
		SubstitutedParam: s.tags.special(s.tags.variableName),
		SubstitutedParamMark: s.tags.processingInstruction,
		SubstitutedParamName: s.tags.variableName,
		HardBreak: s.tags.processingInstruction,
		FilterRun: s.tags.content,
		FilterOperator: s.tags.operator,
		FilterOperatorName: s.tags.operatorKeyword,
		FilterOperand: s.tags.string,
		FilterVariable: s.tags.variableName,
		FilterTextRef: s.tags.special(s.tags.string),
		FilterRegexp: s.tags.regexp,
		StyledBlock: s.tags.content,
		StyledBlockMark: s.tags.processingInstruction,
		StyledBlockClass: s.tags.className,
		ConditionalBlock: s.tags.content,
		Conditional: s.tags.content,
		ConditionalMark: s.tags.processingInstruction,
		ConditionalKeyword: s.tags.controlKeyword,
		ConditionalBranch: s.tags.content,
		Paragraph: s.tags.content,
		Text: s.tags.content,
		Mark: s.tags.processingInstruction,
		ProcessingInstruction: s.tags.processingInstruction
	});
class Lt extends i.Parser {
	constructor(t, n, r, s, a) {
		super(), this.nodeSet = t || function() {
			const t = [],
				n = Object.keys(e).filter(e => isNaN(Number(e)));
			for(const r of n) {
				const n = e[r];
				if("number" == typeof n) {
					for(; t.length <= n;) t.push(i.NodeType.none);
					t[n] = i.NodeType.define({
						id: n,
						name: r,
						props: []
					})
				}
			}
			return new i.NodeSet(t).extend(Ct)
		}(), this.pragmaParsers = n || Z, this.blockParsers = r || Oe, this.inlineParsers = s || Mt, this.wrapFn = a
	}
	createParse(e, t, n) {
		const r = new g(this, e, t, n);
		return this.wrapFn ? this.wrapFn(r, e, t, n) : r
	}
	configure(e) {
		let t = this.nodeSet,
			n = [...this.pragmaParsers],
			r = [...this.blockParsers],
			s = [...this.inlineParsers],
			a = e.wrap || this.wrapFn;
		if(e.remove) {
			const t = new Set(e.remove);
			n = n.filter(e => !t.has(e.name)), r = r.filter(e => !t.has(e.name)), s = s.filter(e => !t.has(e.name))
		}
		if(e.parsePragma)
			for(const t of e.parsePragma) n = vt(n, t);
		if(e.parseBlock)
			for(const t of e.parseBlock) r = vt(r, t);
		if(e.parseInline)
			for(const t of e.parseInline) s = vt(s, t);
		if(e.defineNodes) {
			const n = [...t.types];
			for(const t of e.defineNodes) {
				const e = "string" == typeof t ? t : t.name,
					r = n.length;
				n.push(i.NodeType.define({
					id: r,
					name: e,
					props: []
				}))
			}
			t = new i.NodeSet(n)
		}
		if(e.props)
			for(const n of e.props) t = t.extend(n);
		return new Lt(t, n, r, s, a)
	}
	parseInline(e, t) {
		return function(e, t, n) {
			return new k(e, t, n).parse()
		}(this, e, t)
	}
}

function vt(e, t) {
	const n = [...e];
	if(t.before) {
		const e = n.findIndex(e => e.name === t.before);
		if(e >= 0) return n.splice(e, 0, t), n
	}
	if(t.after) {
		const e = n.findIndex(e => e.name === t.after);
		if(e >= 0) return n.splice(e + 1, 0, t), n
	}
	return n.push(t), n
}
const Pt = new Lt,
	Et = a.defineLanguageFacet({
		commentTokens: {
			block: {
				open: "\x3c!--",
				close: "--\x3e"
			}
		}
	}),
	Bt = new i.NodeProp;

function At(e) {
	const t = /^Heading(\d)$/.exec(e.name);
	return t ? +t[1] : void 0
}

function It(e, t) {
	const n = e.state.doc.lineAt(t);
	let r = 0;
	for(let t = 0; t < n.text.length; t++) {
		const i = n.text.charCodeAt(t);
		if(32 === i) r++;
		else {
			if(9 !== i) break;
			r += e.unit
		}
	}
	return r
}

function Ft(e) {
	const t = e.node,
		n = e.state.doc.lineAt(t.from),
		r = e.state.doc.lineAt(t.to),
		i = It(e, t.from);
	if(n.number === r.number) {
		if(Ot(t.name)) {
			const t = n.text.trim();
			return /^\\(?:define|procedure|function|widget)\s+\S+\s*\([^)]*\)\s*$/.test(t) ? i + e.unit : i
		}
		if(!/^(ConditionalBlock|Widget|HTMLBlock)$/.test(t.name)) return null
	}
	const s = e.state.doc.lineAt(e.pos);
	if(s.number === n.number) {
		const t = s.text;
		if(e.pos >= s.from + t.trimEnd().length) {
			if(/^\s*\\(?:define|procedure|function|widget)\s+\S+\s*\([^)]*\)\s*$/.test(t)) return i + e.unit;
			if(/<%\s*(if|elseif)\s+.+%>\s*$/.test(t) || /<%\s*else\s*%>\s*$/.test(t)) return i + e.unit;
			if(/<%\s*endif\s*%>\s*$/.test(t)) return i;
			if(/<[$a-zA-Z][^>]*>\s*$/.test(t) && !/<\//.test(t) && !/\/>\s*$/.test(t)) return i + e.unit;
			if(/\/>\s*$/.test(t)) return i;
			if(/<\/[$a-zA-Z][^>]*>\s*$/.test(t)) return i
		}
		return null
	}
	if(s.number > 1) {
		const t = e.state.doc.line(s.number - 1).text.trim();
		if(/<%\s*(if|elseif)\s+.+%>\s*$/.test(t) || /<%\s*else\s*%>\s*$/.test(t)) return i + e.unit
	}
	const a = s.text.trim();
	return /^<\/[$a-zA-Z]|^<%\s*endif\s*%>|^\\end(?:\s|$)/.test(a) || /^<%\s*(else|elseif)\s/.test(a) || /^<%\s*else\s*%>/.test(a) ? i : (Ot(t.name), i + e.unit)
}

function Ot(e) {
	return /^(MacroDefinition|ProcedureDefinition|FunctionDefinition|WidgetDefinition)$/.test(e)
}
const Dt = Pt.configure({
	props: [a.foldNodeProp.add(e => {
		if(function(e) {
				return /^(Paragraph|Heading\d|BulletList|OrderedList|DefinitionList|BlockQuote|Table|FencedCode|TypedBlock|Widget|HTMLBlock|TransclusionBlock|FilteredTransclusionBlock|MacroCallBlock|CommentBlock|HorizontalRule|ConditionalBlock|MacroDefinition|ProcedureDefinition|FunctionDefinition|WidgetDefinition|StyledBlock)$/.test(e.name)
			}(e) && "Document" !== e.name && null == At(e) && ! function(e) {
				return "BulletList" === e.name || "OrderedList" === e.name || "DefinitionList" === e.name
			}(e) && "Paragraph" !== e.name) return Ot(e.name) ? (e, t) => {
			const n = t.doc.lineAt(e.from).to;
			let r = e.lastChild;
			if(r && "PragmaEnd" === r.name) {
				const i = t.doc.lineAt(r.from);
				return {
					from: n,
					to: i.from > n ? i.from - 1 : e.to
				}
			}
			return {
				from: n,
				to: e.to
			}
		} : "Widget" === e.name || "HTMLBlock" === e.name ? (t, n) => {
			const r = n.doc.lineAt(t.from).to,
				i = "Widget" === e.name ? t.getChild("WidgetEnd") : t.getChild("HTMLEndTag");
			if(i) {
				const e = n.doc.lineAt(i.from);
				if(e.from > r) return {
					from: r,
					to: e.from - 1
				}
			}
			return {
				from: r,
				to: t.to
			}
		} : "ConditionalBlock" === e.name ? (e, t) => {
			const n = t.doc.lineAt(e.from).to;
			let r = e.lastChild;
			for(; r && "ConditionalMark" !== r.name;) r = r.prevSibling;
			if(r) {
				const e = t.doc.lineAt(r.from);
				if(e.from > n) return {
					from: n,
					to: e.from - 1
				}
			}
			return {
				from: n,
				to: e.to
			}
		} : "BlockQuote" === e.name ? (e, t) => {
			const n = t.doc.lineAt(e.from).to;
			let r = e.lastChild;
			for(; r && "QuoteMark" !== r.name;) r = r.prevSibling;
			if(r && r.from > e.from) {
				const e = t.doc.lineAt(r.from);
				if(e.from > n) return {
					from: n,
					to: e.from - 1
				}
			}
			return {
				from: n,
				to: e.to
			}
		} : "FencedCode" === e.name ? (e, t) => {
			const n = t.doc.lineAt(e.from).to;
			let r = e.lastChild;
			for(; r && "CodeMark" !== r.name;) r = r.prevSibling;
			if(r && r.from > e.from) {
				const e = t.doc.lineAt(r.from);
				if(e.from > n) return {
					from: n,
					to: e.from - 1
				}
			}
			return {
				from: n,
				to: e.to
			}
		} : "TypedBlock" === e.name ? (e, t) => {
			const n = t.doc.lineAt(e.from).to;
			let r = e.lastChild;
			for(; r && "TypedBlockMark" !== r.name;) r = r.prevSibling;
			if(r && r.from > e.from) {
				const e = t.doc.lineAt(r.from);
				if(e.from > n) return {
					from: n,
					to: e.from - 1
				}
			}
			return {
				from: n,
				to: e.to
			}
		} : "Table" === e.name ? (e, t) => {
			const n = t.doc.lineAt(e.from).to,
				r = e.getChild("TableHeader") || e.getChild("TableRow");
			if(r) {
				const n = t.doc.lineAt(r.to).to;
				if(n < e.to) return {
					from: n,
					to: e.to
				}
			}
			return {
				from: n,
				to: e.to
			}
		} : (e, t) => ({
			from: t.doc.lineAt(e.from).to,
			to: e.to
		})
	}), Bt.add(At), a.indentNodeProp.add({
		Document: e => {
			const t = e.state.doc.lineAt(e.pos);
			if(t.number > 1) {
				const n = e.state.doc.line(t.number - 1),
					r = n.text;
				if(/^\s*\\(?:define|procedure|function|widget)\s+\S+\s*\([^)]*\)\s*$/.test(r)) {
					return It(e, n.from) + e.unit
				}
				if(/<%\s*(if|elseif)\s+.+%>\s*$/.test(r) || /<%\s*else\s*%>\s*$/.test(r)) {
					return It(e, n.from) + e.unit
				}
				if(/<[$a-zA-Z][^>]*>\s*$/.test(r) && !/<\//.test(r) && !/\/>\s*$/.test(r)) {
					return It(e, n.from) + e.unit
				}
				if(/^\s*\\end(?:\s|$)/.test(r)) {
					return It(e, n.from)
				}
			}
			return null
		},
		Widget: Ft,
		HTMLBlock: Ft,
		ConditionalBlock: Ft,
		ConditionalBranch: Ft,
		BlockQuote: Ft,
		MacroDefinition: Ft,
		ProcedureDefinition: Ft,
		FunctionDefinition: Ft,
		WidgetDefinition: Ft
	})]
});

function Nt(e, t) {
	let n = e;
	for(;;) {
		const e = n.nextSibling;
		if(!e) break;
		const r = At(e.type);
		if(null != r && r <= t) break;
		n = e
	}
	return n.to
}
const Ht = a.foldService.of((e, t, n) => {
	for(let r = a.syntaxTree(e).resolveInner(n, -1); r && !(r.from < t); r = r.parent) {
		const e = r.type.prop(Bt);
		if(null == e) continue;
		const t = Nt(r, e);
		if(t > n) return {
			from: n,
			to: t
		}
	}
	return null
});

function Wt(e) {
	const t = e.configure({
		props: [a.languageDataProp.add({
			Document: Et
		})]
	});
	return new a.Language(Et, t, [], "tiddlywiki")
}
const Rt = Wt(Dt);
class _t {
	constructor(e, t, n, r, i, s, a) {
		this.node = e, this.from = t, this.to = n, this.spaceBefore = r, this.spaceAfter = i, this.type = s, this.item = a
	}
	blank(e, t = !0) {
		let n = this.spaceBefore;
		if("BlockQuote" == this.node.name && (n += ">"), null != e) {
			for(; n.length < e;) n += " ";
			return n
		}
		for(let e = this.to - this.from - n.length - this.spaceAfter.length; e > 0; e--) n += " ";
		return n + (t ? this.spaceAfter : "")
	}
	marker(e, t) {
		let n = "";
		if("OrderedList" == this.node.name || "BulletList" == this.node.name) {
			let t = e.sliceString(this.item.from, this.item.from + 20),
				r = /^([*#]+)/.exec(t);
			r && (n = r[1])
		} else if("DefinitionList" == this.node.name) {
			let t = e.sliceString(this.item.from, this.item.from + 20),
				r = /^([;:*#]+)/.exec(t);
			n = r ? r[1] : this.type
		} else if("BlockQuote" == this.node.name)
			if("<<<" == this.type) n = "<<<";
			else {
				let t = e.sliceString(this.item.from, this.item.from + 20),
					r = /^([>*#]+)/.exec(t);
				n = r ? r[1] : ">"
			} return this.spaceBefore + n + this.spaceAfter
	}
}

function zt(e, t) {
	let n = [],
		r = [];
	for(let t = e; t; t = t.parent) {
		if("FencedCode" == t.name || "CodeBlock" == t.name) return r;
		"ListItem" != t.name && "BlockQuote" != t.name && "DefinitionTerm" != t.name && "DefinitionDescription" != t.name || n.push(t)
	}
	for(let e = n.length - 1; e >= 0; e--) {
		let i, s = n[e],
			a = t.lineAt(s.from),
			o = s.from - a.from;
		"BlockQuote" == s.name ? (i = /^(\s*)(<<<)(\s*)/.exec(a.text.slice(o)), i && r.push(new _t(s, o, o + i[0].length, i[1], i[3], "<<<", null))) : "ListItem" != s.name || "OrderedList" != s.parent?.name && "BulletList" != s.parent?.name ? "ListItem" == s.name && "BlockQuote" == s.parent?.name ? (i = /^(\s*)([>*#]+)(\s*)/.exec(a.text.slice(o)), i && r.push(new _t(s.parent, o, o + i[0].length, i[1], i[3], i[2], s))) : ("DefinitionTerm" == s.name || "DefinitionDescription" == s.name) && (i = /^(\s*)([;:*#]+)(\s*)/.exec(a.text.slice(o)), i && r.push(new _t(s.parent, o, o + i[0].length, i[1], i[3], i[2], s))) : (i = /^(\s*)([*#]+)(\s+)/.exec(a.text.slice(o)), i && r.push(new _t(s.parent, o, o + i[0].length, i[1], i[3], i[2], s)))
	}
	return r
}

function Vt(e, t) {
	let r = /^[ \t]*/.exec(e)[0].length;
	if(!r || "\t" != t.facet(a.indentUnit)) return e;
	let i = "";
	for(let t = n.countColumn(e, 4, r); t > 0;) t >= 4 ? (i += "\t", t -= 4) : (i += " ", t--);
	return i + e.slice(r)
}
const Zt = (e = {}) => ({
		state: e,
		dispatch: t
	}) => {
		let r = a.syntaxTree(e),
			{
				doc: i
			} = e,
			s = null,
			o = e.changeByRange(t => {
				if(!t.empty || !Rt.isActiveAt(e, t.from, -1) && !Rt.isActiveAt(e, t.from, 1)) return s = {
					range: t
				};
				let o = t.from,
					l = i.lineAt(o),
					c = r.resolveInner(o, -1);
				"Document" === c.name && o > 0 && (c = r.resolveInner(o - 1, -1));
				let d = zt(c, i);
				for(; d.length && d[d.length - 1].from > o - l.from;) d.pop();
				if(!d.length) {
					const t = l.text,
						r = e.facet(a.indentUnit),
						i = "\t" === r ? e.tabSize : r.length;
					let s = 0;
					for(let n = 0; n < t.length; n++) {
						const r = t.charCodeAt(n);
						if(32 === r) s++;
						else {
							if(9 !== r) break;
							s += e.tabSize
						}
					}
					const c = o - l.from,
						d = t.slice(0, c),
						u = t.slice(c);
					if(/>$/.test(d) && /^<\//.test(u)) {
						let t = "",
							a = "";
						if("\t" === r) {
							t = "\t".repeat(Math.floor(s / e.tabSize));
							const n = s % e.tabSize;
							n > 0 && (t += " ".repeat(n)), a = t + "\t"
						} else t = " ".repeat(s), a = " ".repeat(s + i);
						const l = e.lineBreak + a + e.lineBreak + t,
							c = o + e.lineBreak.length + a.length;
						return {
							range: n.EditorSelection.cursor(c),
							changes: {
								from: o,
								insert: l
							}
						}
					}
					let f = a.getIndentation(e, o);
					const p = t.trim(),
						h = u.trim();
					/^\\end(?:\s|$)/.test(p) && "" === h ? f = s : null != f && 0 !== f || ("" === p || /^<[$a-zA-Z\/]/.test(h) || /^<%/.test(h) || /^\\end\b/.test(h) ? f = s : /<%\s*(if|elseif)\s+.+%>\s*$/.test(p) || /<%\s*else\s*%>\s*$/.test(p) ? f = s + i : !/<[$a-zA-Z][^>]*>\s*$/.test(p) || /<\//.test(p) || p.endsWith("/>") ? (/<%\s*endif\s*%>\s*$/.test(p) || /<\/[$a-zA-Z][^>]*>\s*$/.test(p)) && (f = s) : f = s + i);
					let m = "";
					if(null != f && f > 0)
						if("\t" === r) {
							m = "\t".repeat(Math.floor(f / e.tabSize));
							const t = f % e.tabSize;
							t > 0 && (m += " ".repeat(t))
						} else m = " ".repeat(f);
					const g = e.lineBreak + m;
					return {
						range: n.EditorSelection.cursor(o + g.length),
						changes: {
							from: o,
							insert: g
						}
					}
				}
				let u = d[d.length - 1];
				if(u.to - u.spaceAfter.length > o - l.from) return s = {
					range: t
				};
				let f = o >= u.to - u.spaceAfter.length && !/\S/.test(l.text.slice(u.to));
				if(u.item && f) {
					let e, t = d.length > 1 ? d[d.length - 2] : null,
						r = "";
					t && t.item ? (e = l.from + t.from, r = t.marker(i, 1)) : e = l.from + (t ? t.to : 0);
					let s = [{
						from: e,
						to: o,
						insert: r
					}];
					return {
						range: n.EditorSelection.cursor(e + r.length),
						changes: s
					}
				}
				let p = [],
					h = u.item && u.item.from < l.from,
					m = "";
				if(!h || /^[\s\*#;:>]*/.exec(l.text)[0].length >= u.to)
					for(let e = 0, t = d.length - 1; e <= t; e++) m += e != t || h ? d[e].blank(e < t ? n.countColumn(l.text, 4, d[e + 1].from) - m.length : null) : d[e].marker(i, 1);
				let g = o;
				for(; g > l.from && /\s/.test(l.text.charAt(g - l.from - 1));) g--;
				return m = Vt(m, e), p.push({
					from: g,
					to: o,
					insert: e.lineBreak + m
				}), {
					range: n.EditorSelection.cursor(g + m.length + 1),
					changes: p
				}
			});
		return !s && (t(e.update(o, {
			scrollIntoView: !0,
			userEvent: "input"
		})), !0)
	},
	jt = Zt();

function Kt(e) {
	return "QuoteMark" == e.name || "ListMark" == e.name || "HeadingMark" == e.name
}
const Ut = ({
		state: e,
		dispatch: t
	}) => {
		let r = a.syntaxTree(e),
			i = null,
			s = e.changeByRange(t => {
				let s = t.from,
					{
						doc: a
					} = e;
				if(t.empty && Rt.isActiveAt(e, t.from)) {
					let t = a.lineAt(s),
						i = zt(function(e, t) {
							let n = e.resolveInner(t, -1),
								r = t;
							Kt(n) && (r = n.from, n = n.parent);
							for(let e; e = n.childBefore(r);)
								if(Kt(e)) r = e.from;
								else {
									if("OrderedList" != e.name && "BulletList" != e.name && "DefinitionList" != e.name) break;
									n = e.lastChild, r = n.to
								} return n
						}(r, s), a);
					if(i.length) {
						let r = i[i.length - 1],
							a = r.to - r.spaceAfter.length + (r.spaceAfter ? 1 : 0);
						if(s - t.from > a && !/\S/.test(t.text.slice(a, s - t.from))) return {
							range: n.EditorSelection.cursor(t.from + a),
							changes: {
								from: t.from + a,
								to: s
							}
						};
						if(s - t.from == a && (!r.item || t.from <= r.item.from || !/\S/.test(t.text.slice(0, r.to)))) {
							let i = t.from + r.from;
							if(r.item && r.node.from < r.item.from && /\S/.test(t.text.slice(r.from, r.to))) {
								let s = r.blank(n.countColumn(t.text, 4, r.to) - n.countColumn(t.text, 4, r.from));
								return i == t.from && (s = Vt(s, e)), {
									range: n.EditorSelection.cursor(i + s.length),
									changes: {
										from: i,
										to: t.from + r.to,
										insert: s
									}
								}
							}
							if(i < s) return {
								range: n.EditorSelection.cursor(i),
								changes: {
									from: i,
									to: s
								}
							}
						}
					}
				}
				return i = {
					range: t
				}
			});
		return !i && (t(e.update(s, {
			scrollIntoView: !0,
			userEvent: "delete"
		})), !0)
	},
	Qt = {
		'"': '"',
		"'": "'",
		"`": "`",
		"(": ")",
		"[": "]",
		"{": "}"
	},
	qt = ({
		state: e,
		dispatch: t
	}) => {
		let r = [],
			i = [];
		for(let t of e.selection.ranges) {
			if(!t.empty) return !1;
			const n = t.from;
			if(0 === n) return !1;
			const s = e.doc.sliceString(n - 1, n),
				a = e.doc.sliceString(n, n + 1),
				o = Qt[s];
			if(!o || a !== o) return !1;
			r.push({
				from: n - 1,
				to: n + 1
			}), i.push({
				anchor: n - 1
			})
		}
		return 0 !== r.length && (t(e.update({
			changes: r,
			selection: n.EditorSelection.create(i.map(e => n.EditorSelection.cursor(e.anchor))),
			scrollIntoView: !0,
			userEvent: "delete"
		})), !0)
	};

function Gt(e, t, r) {
	let i = e.changeByRange(t => {
		if(t.empty) return {
			range: n.EditorSelection.cursor(t.from + r.length),
			changes: {
				from: t.from,
				insert: r + r
			}
		};
		{
			let i = e.doc.sliceString(t.from, t.to);
			if(i.startsWith(r) && i.endsWith(r) && i.length >= 2 * r.length) {
				let e = i.slice(r.length, -r.length);
				return {
					range: n.EditorSelection.range(t.from, t.from + e.length),
					changes: {
						from: t.from,
						to: t.to,
						insert: e
					}
				}
			}
			return {
				range: n.EditorSelection.range(t.from, t.to + 2 * r.length),
				changes: [{
					from: t.from,
					insert: r
				}, {
					from: t.to,
					insert: r
				}]
			}
		}
	});
	return t(e.update(i, {
		scrollIntoView: !0,
		userEvent: "input"
	})), !0
}
const Jt = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, "''"),
	Xt = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, "//"),
	Yt = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, "__"),
	en = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, "~~"),
	tn = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, "^^"),
	nn = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, ",,"),
	rn = ({
		state: e,
		dispatch: t
	}) => Gt(e, t, "`"),
	sn = ({
		state: e,
		dispatch: t
	}) => {
		let r = e.changeByRange(t => {
			if(t.empty) return {
				range: n.EditorSelection.cursor(t.from + 2),
				changes: {
					from: t.from,
					insert: "[[]]"
				}
			};
			{
				let r = e.doc.sliceString(t.from, t.to);
				return {
					range: n.EditorSelection.range(t.from + 2, t.from + 2 + r.length),
					changes: {
						from: t.from,
						to: t.to,
						insert: `[[${r}]]`
					}
				}
			}
		});
		return t(e.update(r, {
			scrollIntoView: !0,
			userEvent: "input"
		})), !0
	},
	an = ({
		state: e,
		dispatch: t
	}) => {
		let r = e.changeByRange(t => {
			if(t.empty) return {
				range: n.EditorSelection.cursor(t.from + 2),
				changes: {
					from: t.from,
					insert: "{{}}"
				}
			};
			{
				let r = e.doc.sliceString(t.from, t.to);
				return {
					range: n.EditorSelection.range(t.from + 2, t.from + 2 + r.length),
					changes: {
						from: t.from,
						to: t.to,
						insert: `{{${r}}}`
					}
				}
			}
		});
		return t(e.update(r, {
			scrollIntoView: !0,
			userEvent: "input"
		})), !0
	};

function on(e, t, r) {
	let {
		doc: i
	} = e, s = new Set, a = e.changeByRange(e => {
		let t = i.lineAt(e.from);
		if(s.has(t.number)) return {
			range: e
		};
		s.add(t.number);
		let a = t.text,
			o = /^(!+)\s*/.exec(a),
			l = o ? o[0].length : 0,
			c = r > 0 ? "!".repeat(r) + " " : "",
			d = c.length - l,
			u = Math.max(t.from + c.length, e.anchor + d),
			f = e.empty ? u : Math.max(t.from + c.length, e.head + d);
		return {
			range: n.EditorSelection.range(u, f),
			changes: {
				from: t.from,
				to: t.from + l,
				insert: c
			}
		}
	});
	return t(e.update(a, {
		scrollIntoView: !0,
		userEvent: "input"
	})), !0
}
const ln = ({
		state: e,
		dispatch: t
	}) => on(e, t, 1),
	cn = ({
		state: e,
		dispatch: t
	}) => on(e, t, 2),
	dn = ({
		state: e,
		dispatch: t
	}) => on(e, t, 3),
	un = ({
		state: e,
		dispatch: t
	}) => on(e, t, 4),
	fn = ({
		state: e,
		dispatch: t
	}) => on(e, t, 5),
	pn = ({
		state: e,
		dispatch: t
	}) => on(e, t, 6),
	hn = ({
		state: e,
		dispatch: t
	}) => on(e, t, 0);

function mn(e, t, r) {
	let {
		doc: i
	} = e, s = new Set, a = e.changeByRange(e => {
		let t = i.lineAt(e.from);
		if(s.has(t.number)) return {
			range: e
		};
		s.add(t.number);
		let a = t.text,
			o = new RegExp(`^(${r.replace(/[*#]/g,"\\$&")}+)\\s*`).exec(a);
		if(o) {
			let r = -o[0].length,
				i = Math.max(t.from, e.anchor + r),
				s = e.empty ? i : Math.max(t.from, e.head + r);
			return {
				range: n.EditorSelection.range(i, s),
				changes: {
					from: t.from,
					to: t.from + o[0].length,
					insert: ""
				}
			}
		} {
			let i = /^([*#;:]+)\s*/.exec(a),
				s = r + " ",
				o = i ? i[0].length : 0,
				l = s.length - o,
				c = Math.max(t.from + s.length, e.anchor + l),
				d = e.empty ? c : Math.max(t.from + s.length, e.head + l);
			return i ? {
				range: n.EditorSelection.range(c, d),
				changes: {
					from: t.from,
					to: t.from + i[0].length,
					insert: s
				}
			} : {
				range: n.EditorSelection.range(c, d),
				changes: {
					from: t.from,
					insert: s
				}
			}
		}
	});
	return t(e.update(a, {
		scrollIntoView: !0,
		userEvent: "input"
	})), !0
}
const gn = ({
		state: e,
		dispatch: t
	}) => mn(e, t, "*"),
	kn = ({
		state: e,
		dispatch: t
	}) => mn(e, t, "#"),
	xn = ({
		state: e,
		dispatch: t
	}) => {
		let r = e.changeByRange(t => {
			if(t.empty) {
				let r = e.doc.lineAt(t.from),
					i = "```\n\n```\n",
					s = r.from + 4;
				return {
					range: n.EditorSelection.cursor(s),
					changes: {
						from: r.from,
						insert: i
					}
				}
			} {
				let r = e.doc.sliceString(t.from, t.to),
					i = "```\n" + r + "\n```";
				return {
					range: n.EditorSelection.range(t.from + 4, t.from + 4 + r.length),
					changes: {
						from: t.from,
						to: t.to,
						insert: i
					}
				}
			}
		});
		return t(e.update(r, {
			scrollIntoView: !0,
			userEvent: "input"
		})), !0
	},
	bn = r.EditorView.inputHandler.of((e, t, n, r) => {
		if(!/^[*#>;:]$/.test(r)) return !1;
		if(t !== n) return !1;
		let i = e.state.doc.lineAt(t),
			s = i.from,
			a = t - s,
			o = i.text,
			l = /^([*#>;:]+) $/.exec(o.slice(0, a));
		if(l) {
			let n = l[1] + r + " ";
			return e.dispatch({
				changes: {
					from: s,
					to: t,
					insert: n
				},
				selection: {
					anchor: s + n.length
				}
			}), !0
		}
		return !1
	}),
	yn = ({
		state: e,
		dispatch: t
	}) => {
		let {
			doc: r,
			selection: i
		} = e, s = i.main;
		if(!s.empty) return !1;
		let a = s.from,
			o = r.lineAt(a),
			l = a - o.from,
			c = o.text,
			d = /^(\*{2,}) $/.exec(c.slice(0, l));
		if(d && l === d[0].length) {
			let r = d[1].slice(0, -1) + " ";
			return t(e.update({
				changes: {
					from: o.from,
					to: a,
					insert: r
				},
				selection: n.EditorSelection.cursor(o.from + r.length)
			})), !0
		}
		let u = /^(#{2,}) $/.exec(c.slice(0, l));
		if(u && l === u[0].length) {
			let r = u[1].slice(0, -1) + " ";
			return t(e.update({
				changes: {
					from: o.from,
					to: a,
					insert: r
				},
				selection: n.EditorSelection.cursor(o.from + r.length)
			})), !0
		}
		return !1
	},
	wn = ({
		state: e,
		dispatch: t
	}) => {
		let {
			doc: n,
			selection: r
		} = e, i = [], s = new Set, a = !1;
		for(let e of r.ranges) {
			let t = n.lineAt(e.from),
				r = n.lineAt(e.to);
			for(let e = t.number; e <= r.number; e++) {
				if(s.has(e)) continue;
				s.add(e);
				let t = n.line(e),
					r = t.text,
					o = /^([*#>]+)( )/.exec(r);
				if(o) {
					let e = o[1],
						n = e[e.length - 1],
						r = t.from + e.length;
					i.push({
						from: r,
						to: r,
						insert: n
					}), a = !0;
					continue
				}
				let l = /^([;:]+)(\s*)/.exec(r);
				if(l) {
					let e = l[1],
						n = e[e.length - 1],
						r = t.from + e.length;
					i.push({
						from: r,
						to: r,
						insert: n
					}), a = !0;
					continue
				}
			}
		}
		return !(!a || 0 === i.length) && (t(e.update({
			changes: i,
			scrollIntoView: !0,
			userEvent: "input"
		})), !0)
	},
	$n = ({
		state: e,
		dispatch: t
	}) => {
		let {
			doc: n,
			selection: r
		} = e, i = [], s = new Set, a = !1;
		for(let e of r.ranges) {
			let t = n.lineAt(e.from),
				r = n.lineAt(e.to);
			for(let e = t.number; e <= r.number; e++) {
				if(s.has(e)) continue;
				s.add(e);
				let t = n.line(e),
					r = t.text,
					o = /^([*#>]{2,})( )/.exec(r);
				if(o) {
					let e = o[1],
						n = t.from + e.length - 1;
					i.push({
						from: n,
						to: n + 1
					}), a = !0;
					continue
				}
				let l = /^([;:]{2,})(\s*)/.exec(r);
				if(l) {
					let e = l[1],
						n = t.from + e.length - 1;
					i.push({
						from: n,
						to: n + 1
					}), a = !0;
					continue
				}
				/^([*#>]) /.exec(r) ? (i.push({
					from: t.from,
					to: t.from + 2
				}), a = !0) : /^([;:]) /.exec(r) && (i.push({
					from: t.from,
					to: t.from + 2
				}), a = !0)
			}
		}
		return !!a && (0 === i.length || t(e.update({
			changes: i,
			scrollIntoView: !0,
			userEvent: "input"
		})), !0)
	},
	Tn = n.StateEffect.define(),
	Mn = r.EditorView.updateListener.of(e => {
		for(const t of e.transactions)
			for(const n of t.effects)
				if(n.is(Tn)) return void setTimeout(() => {
					null === o.completionStatus(e.view.state) && o.startCompletion(e.view)
				}, 10)
	}),
	Sn = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]),
	Cn = new Set(["$action-confirm", "$action-createtiddler", "$action-deletetiddler", "$action-deletefield", "$action-listops", "$action-log", "$action-navigate", "$action-popup", "$action-sendmessage", "$action-setfield", "$action-setmultiplefields"]);

function Ln(e, t, n, r, i) {
	const s = e.state.selection.ranges,
		a = e.state.selection.mainIndex;
	return s.map((e, s) => s === a ? {
		from: t,
		to: n,
		insert: r
	} : {
		from: e.from - i,
		to: e.from,
		insert: r
	})
}
const vn = a.HighlightStyle.define([{
		tag: s.tags.heading1,
		class: "cm-tw-heading1"
	}, {
		tag: s.tags.heading2,
		class: "cm-tw-heading2"
	}, {
		tag: s.tags.heading3,
		class: "cm-tw-heading3"
	}, {
		tag: s.tags.heading4,
		class: "cm-tw-heading4"
	}, {
		tag: s.tags.heading5,
		class: "cm-tw-heading5"
	}, {
		tag: s.tags.heading6,
		class: "cm-tw-heading6"
	}, {
		tag: s.tags.heading,
		class: "cm-tw-tableheader"
	}, {
		tag: s.tags.strong,
		class: "cm-tw-bold"
	}, {
		tag: s.tags.emphasis,
		class: "cm-tw-italic"
	}, {
		tag: s.tags.strikethrough,
		class: "cm-tw-strikethrough"
	}, {
		tag: s.tags.link,
		class: "cm-tw-wikilink"
	}, {
		tag: s.tags.url,
		class: "cm-tw-url"
	}, {
		tag: s.tags.string,
		class: "cm-tw-linktext"
	}, {
		tag: s.tags.special(s.tags.link),
		class: "cm-tw-transclusion"
	}, {
		tag: s.tags.macroName,
		class: "cm-tw-macrocall"
	}, {
		tag: s.tags.variableName,
		class: "cm-tw-variable"
	}, {
		tag: s.tags.tagName,
		class: "cm-tw-widget"
	}, {
		tag: s.tags.monospace,
		class: "cm-tw-code"
	}, {
		tag: s.tags.labelName,
		class: "cm-tw-codeinfo"
	}, {
		tag: s.tags.definitionKeyword,
		class: "cm-tw-pragma"
	}, {
		tag: s.tags.keyword,
		class: "cm-tw-pragma-keyword"
	}, {
		tag: s.tags.controlKeyword,
		class: "cm-tw-conditional"
	}, {
		tag: s.tags.list,
		class: "cm-tw-list"
	}, {
		tag: s.tags.quote,
		class: "cm-tw-blockquote"
	}, {
		tag: s.tags.contentSeparator,
		class: "cm-tw-hr"
	}, {
		tag: s.tags.comment,
		class: "cm-tw-comment"
	}, {
		tag: s.tags.escape,
		class: "cm-tw-escape"
	}, {
		tag: s.tags.character,
		class: "cm-tw-entity"
	}, {
		tag: s.tags.processingInstruction,
		class: "cm-tw-mark"
	}, {
		tag: s.tags.special(s.tags.string),
		class: "cm-tw-filter"
	}, {
		tag: s.tags.attributeValue,
		class: "cm-tw-attribute-value"
	}, {
		tag: s.tags.attributeName,
		class: "cm-tw-attribute"
	}, {
		tag: s.tags.special(s.tags.emphasis),
		class: "cm-tw-underline"
	}, {
		tag: St.twSuperscript,
		class: "cm-tw-superscript"
	}, {
		tag: St.twSubscript,
		class: "cm-tw-subscript"
	}, {
		tag: s.tags.special(s.tags.content),
		class: "cm-tw-highlight"
	}]),
	Pn = [{
		key: "Enter",
		run: jt
	}, {
		key: "Backspace",
		run: e => qt(e) || yn(e) || Ut(e)
	}, {
		key: "Tab",
		run: wn
	}, {
		key: "Shift-Tab",
		run: $n
	}, {
		key: "Mod-b",
		run: Jt
	}, {
		key: "Mod-i",
		run: Xt
	}, {
		key: "Mod-u",
		run: Yt
	}, {
		key: "Mod-`",
		run: rn
	}, {
		key: "Mod-k",
		run: sn
	}, {
		key: "Mod-Shift-k",
		run: an
	}, {
		key: "Mod-1",
		run: ln
	}, {
		key: "Mod-2",
		run: cn
	}, {
		key: "Mod-3",
		run: dn
	}, {
		key: "Mod-4",
		run: un
	}, {
		key: "Mod-5",
		run: fn
	}, {
		key: "Mod-6",
		run: pn
	}, {
		key: "Mod-0",
		run: hn
	}, {
		key: "Mod-Shift-8",
		run: gn
	}, {
		key: "Mod-Shift-7",
		run: kn
	}, {
		key: "Mod-Shift-c",
		run: xn
	}],
	En = l.html({
		matchClosingTags: !1
	});

function Bn(e, t, n) {
	const r = function(e, t, n) {
		const r = ["tiddlywiki", "wikitext", "tw", "tw5"];
		return i => {
			if(i && e) {
				let s = null;
				if(i = /\S*/.exec(i)[0], r.includes(i.toLowerCase())) return n ?? t?.parser ?? null;
				if(s = "function" == typeof e ? e(i) : a.LanguageDescription.matchLanguageName(e, i, !0), s instanceof a.LanguageDescription) {
					const e = s.name?.toLowerCase() || "",
						i = s.alias?.map(e => e.toLowerCase()) || [];
					return "tiddlywiki" === e || r.some(e => i.includes(e)) ? n ?? t?.parser ?? null : s.support ? s.support.language.parser : a.ParseContext.getSkippingParser(s.load())
				}
				if(s) return s.parser
			}
			return t ? t.parser : null
		}
	}(e, t, n);
	return i.parseMixed((e, t) => {
		if("CodeText" === e.name) {
			const i = e.node.parent;
			if("FencedCode" === i?.name) {
				const e = i.getChild("CodeInfo"),
					n = e ? t.read(e.from, e.to) : "",
					s = r(n);
				if(s) return {
					parser: s
				}
			}
			if("TypedBlock" === i?.name) {
				const e = i.getChild("TypedBlockType"),
					s = e ? t.read(e.from, e.to) : "";
				if(("text/vnd.tiddlywiki" === s || "text/x-tiddlywiki" === s) && n) return {
					parser: n
				};
				if("text/plain" === s) return null;
				const a = function(e) {
					const t = {
						".js": "javascript",
						".mjs": "javascript",
						".cjs": "javascript",
						".ts": "typescript",
						".tsx": "typescript",
						".jsx": "javascript",
						".css": "css",
						".html": "html",
						".htm": "html",
						".json": "json",
						".md": "markdown",
						".markdown": "markdown",
						".xml": "xml",
						".svg": "xml",
						".py": "python",
						".rb": "ruby",
						".java": "java",
						".c": "c",
						".cpp": "cpp",
						".h": "c",
						".hpp": "cpp",
						".rs": "rust",
						".go": "go",
						".php": "php",
						".sql": "sql",
						".sh": "shell",
						".bash": "shell",
						".yaml": "yaml",
						".yml": "yaml",
						".toml": "toml"
					};
					return e.startsWith(".") ? t[e.toLowerCase()] ?? "" : {
						"text/javascript": "javascript",
						"application/javascript": "javascript",
						"text/typescript": "typescript",
						"application/typescript": "typescript",
						"text/css": "css",
						"text/html": "html",
						"application/json": "json",
						"text/x-markdown": "markdown",
						"text/x-tiddlywiki": "",
						"text/vnd.tiddlywiki": "",
						"text/plain": ""
					} [e] ?? e.replace(/^text\/x-/, "").replace(/^application\//, "").replace(/^text\//, "")
				}(s);
				if(a) {
					const e = r(a);
					if(e) return {
						parser: e
					}
				}
			}
		}
		if("HTMLBlock" === e.name) {
			const n = e.node.getChild("TagName");
			if(n) {
				const i = t.read(n.from, n.to).toLowerCase();
				if("style" === i || "script" === i) {
					const n = r("style" === i ? "css" : "javascript");
					if(n) {
						let r = -1,
							i = -1;
						const s = e.node.cursor();
						s.firstChild();
						do {
							if("TagMark" === s.name && -1 === r) {
								">" === t.read(s.from, s.to) && (r = s.to)
							}
							if("HTMLEndTag" === s.name) {
								i = s.from;
								break
							}
						} while(s.nextSibling());
						if(r > 0 && i > r) return {
							parser: n,
							overlay: [{
								from: r,
								to: i
							}]
						}
					}
				}
			}
		}
		return null
	})
}

function An(e = {}) {
	const {
		codeLanguages: t,
		defaultCodeLanguage: i,
		addKeymap: s = !0,
		base: {
			parser: c
		} = Rt,
		completeHTMLTags: d = !0,
		completeWidgets: u = !0,
		completeMacros: f = !0,
		completeTiddlers: p = !0,
		completeFilterOperators: h = !0,
		completeFilterRunPrefixes: m = !0,
		getTiddlerTitles: g,
		getImageTiddlerTitles: k,
		getMacroNames: x,
		getMacroParams: b,
		getWidgetNames: y,
		getWidgetAttributes: w,
		getFilterOperators: $,
		getFieldNames: T,
		getTagNames: M,
		getFunctionNames: S,
		getVariableNames: C,
		getTiddlerIndexes: L,
		getTiddlerFields: v,
		getStoryViews: P,
		getDeserializers: E,
		htmlTagLanguage: B = En,
		getSelfClosingWidgets: A
	} = e;
	if(!(c instanceof Lt)) throw new RangeError("Base parser provided to `tiddlywiki` should be a TiddlyWiki parser");
	const I = e.extensions ? [e.extensions] : [],
		F = [B.support, Ht, a.indentOnInput(), a.syntaxHighlighting(vn), o.autocompletion({
			activateOnTyping: !0
		}), r.keymap.of(o.completionKeymap), bn, Mn];
	let O;
	i instanceof a.LanguageSupport ? (F.push(i.support), O = i.language) : i && (O = i);
	const D = ["tiddlywiki", "wikitext", "tw", "tw5"];
	if(t && Array.isArray(t))
		for(const e of t) {
			const t = e.name?.toLowerCase() || "",
				n = e.alias?.map(e => e.toLowerCase()) || [];
			"tiddlywiki" === t || D.some(e => n.includes(e)) || e.support && F.push(e.support.support)
		}
	const N = Bn(t, O, c);
	I.push({
		wrap: N
	}), s && Pn.length > 0 && F.push(n.Prec.high(r.keymap.of(Pn)));
	let H = c;
	if(I.length > 0)
		for(const e of I) H = H.configure(e);
	const W = Wt(H);
	return F.push(W.data.of({
		indentOnInput: /^\s*(<\/[a-zA-Z$][^>]*>|<%\s*(else|elseif|endif)[^%]*%>|\\end\s*)$/
	})), u && (F.push(W.data.of({
		autocomplete: Dn(y, A)
	})), F.push(W.data.of({
		autocomplete: Nn(b, w)
	})), F.push(W.data.of({
		autocomplete: Hn(x, g, S, C, T, L, P, E)
	})), F.push(r.EditorView.inputHandler.of((e, t, n, r) => {
		if('"' !== r && "'" !== r) return !1;
		return "=" !== e.state.sliceDoc(Math.max(0, t - 1), t) || setTimeout(() => {
			null === o.completionStatus(e.state) && o.startCompletion(e)
		}, 10), !1
	})), F.push(r.EditorView.inputHandler.of((e, t, n, r) => {
		if(">" !== r) return !1;
		if("/" === e.state.sliceDoc(Math.max(0, t - 1), t)) return !1;
		let i = a.syntaxTree(e.state).resolveInner(t, -1),
			s = null,
			o = "",
			l = !1;
		for(; i && !i.type.isTop;) {
			const t = i.name;
			if("MacroCall" === t || "MacroName" === t) return !1;
			if("AttributeValue" === t || "AttributeString" === t) return !1;
			if("InlineWidget" === t || "Widget" === t || "HTMLBlock" === t || "HTMLTag" === t) {
				let n = !1,
					r = null;
				const a = i.cursor();
				if(a.firstChild())
					do {
						"WidgetName" !== a.name && "TagName" !== a.name || (r = a.node), "TagMark" === a.name && a.from > i.from && (n = !0)
					} while(a.nextSibling());
				if(!n && r) {
					s = i, o = e.state.sliceDoc(r.from, r.to), l = "InlineWidget" === t || "Widget" === t;
					break
				}
			}
			i = i.parent
		}
		if(!s || !o) return !1;
		if(l) {
			const e = new Set(Cn);
			if(A)
				for(const t of A()) e.add(t);
			if(e.has(o)) return !1
		} else if(Sn.has(o.toLowerCase())) return !1;
		const c = `</${o}>`;
		return e.dispatch({
			changes: {
				from: t,
				to: t,
				insert: ">" + c
			},
			selection: {
				anchor: t + 1
			}
		}), !0
	}))), f && (F.push(W.data.of({
		autocomplete: Un(x, S, C)
	})), b && F.push(W.data.of({
		autocomplete: Qn(b)
	}))), p && (F.push(W.data.of({
		autocomplete: qn(g, k)
	})), F.push(W.data.of({
		autocomplete: Gn(v, L)
	}))), d && (F.push(W.data.of({
		autocomplete: Xn
	})), F.push(W.data.of({
		autocomplete: tr
	})), F.push(W.data.of({
		autocomplete: e => {
			const t = e.state.sliceDoc(Math.max(0, e.pos - 100), e.pos);
			return /<\$[\w\-\.]*$/.test(t) || /<\$[\w\-\.]+\s+[^>]*$/.test(t) ? null : l.htmlCompletionSource(e)
		}
	}))), h && F.push(W.data.of({
		autocomplete: nr($)
	})), m && F.push(W.data.of({
		autocomplete: ir
	})), h && F.push(W.data.of({
		autocomplete: sr(T)
	})), h && F.push(W.data.of({
		autocomplete: cr(g, M, T, S, C)
	})), F.push(W.data.of({
		autocomplete: ur
	})), F.push(W.data.of({
		autocomplete: pr
	})), F.push(W.data.of({
		autocomplete: hr
	})), new a.LanguageSupport(W, F)
}

function In(e) {
	return e.startsWith("$:/") ? -1 : 1
}
const Fn = ["$action-confirm", "$action-createtiddler", "$action-deletefield", "$action-deletetiddler", "$action-listops", "$action-log", "$action-navigate", "$action-popup", "$action-sendmessage", "$action-setfield", "$action-setmultiplefields", "$browse", "$button", "$checkbox", "$codeblock", "$count", "$draggable", "$droppable", "$dropzone", "$edit", "$edit-bitmap", "$edit-text", "$element", "$encrypt", "$eventcatcher", "$fieldmangler", "$fill", "$genesis", "$image", "$importvariables", "$keyboard", "$let", "$link", "$linkcatcher", "$list", "$log", "$macrocall", "$messagecatcher", "$navigator", "$password", "$qualify", "$radio", "$range", "$raw", "$reveal", "$scrollable", "$select", "$set", "$setvariable", "$slot", "$text", "$tiddler", "$transclude", "$type", "$vars", "$view", "$wikify"],
	On = {
		"$action-confirm": ["$message", "$prompt"],
		"$action-createtiddler": ["$basetitle", "$savetitle", "$saveoriginal", "$template", "$overwrite", "$timestamp"],
		"$action-deletefield": ["$tiddler", "$field"],
		"$action-deletetiddler": ["$tiddler", "$filter"],
		"$action-listops": ["$tiddler", "$field", "$index", "$filter", "$subfilter", "$tags"],
		"$action-log": ["$$filter", "$$message", "$$all"],
		"$action-navigate": ["$to", "$scroll"],
		"$action-popup": ["$state", "$coords", "$floating", "$absolute"],
		"$action-sendmessage": ["$message", "$param", "$name", "$value"],
		"$action-setfield": ["$tiddler", "$field", "$index", "$value", "$timestamp"],
		"$action-setmultiplefields": ["$tiddler", "$fields", "$values", "$indexes"],
		$browse: ["multiple", "accept", "message", "param", "tooltip", "deserializer", "class"],
		$button: ["message", "param", "set", "setTo", "actions", "to", "tooltip", "aria-label", "popup", "popupAbsolute", "hoverpopup", "selectedClass", "default", "disabled", "tag", "dragTiddler", "dragFilter", "class", "style"],
		$checkbox: ["tiddler", "field", "index", "tag", "invertTag", "checked", "unchecked", "default", "indeterminate", "disabled", "actions", "uncheckactions", "checkactions", "class"],
		$codeblock: ["code", "language", "class"],
		$count: ["filter"],
		$draggable: ["tiddler", "filter", "tag", "enable", "startactions", "endactions", "class"],
		$droppable: ["actions", "effect", "tag", "enable", "disabledClass", "class"],
		$dropzone: ["deserializer", "enable", "autoOpenOnImport", "importTitle", "actions", "contentTypesFilter", "filesOnly", "class"],
		$edit: ["tiddler", "field", "index", "default", "placeholder", "tabindex", "focus", "cancelPopups", "inputActions", "refreshTitle", "autocomplete", "class"],
		"$edit-bitmap": ["tiddler", "class"],
		"$edit-text": ["tiddler", "field", "index", "default", "tag", "type", "placeholder", "focusPopup", "focus", "tabindex", "autocomplete", "cancelPopups", "inputActions", "refreshTitle", "disabled", "fileDrop", "rows", "minHeight", "size", "class"],
		$element: ["tag", "attributes"],
		$encrypt: ["filter"],
		$eventcatcher: ["type", "actions", "tag", "events", "class"],
		$fieldmangler: ["tiddler"],
		$fill: ["$name"],
		$genesis: ["$type", "$tag", "$names", "$values", "$mode"],
		$image: ["source", "width", "height", "tooltip", "alt", "loading", "usemap", "class"],
		$importvariables: ["filter"],
		$keyboard: ["key", "actions", "tag", "class"],
		$let: [],
		$link: ["to", "tooltip", "aria-label", "tabindex", "draggable", "tag", "overrideClass", "class"],
		$linkcatcher: ["to", "message", "set", "setTo", "actions"],
		$list: ["filter", "variable", "counter", "emptyMessage", "storyview", "history", "template", "editTemplate", "join"],
		$log: ["$$filter", "$$message", "$$all"],
		$macrocall: ["$name", "$type", "$output"],
		$messagecatcher: ["$message", "$count", "actions"],
		$navigator: ["story", "history", "openLinkFromInsideRiver", "openLinkFromOutsideRiver", "relinkOnRename"],
		$password: ["name", "class"],
		$qualify: ["name"],
		$radio: ["tiddler", "field", "index", "value", "default", "disabled", "actions", "class"],
		$range: ["tiddler", "field", "index", "min", "max", "increment", "default", "disabled", "actions", "actionsStart", "actionsStop", "class"],
		$raw: [],
		$reveal: ["type", "text", "state", "tag", "retain", "default", "popup", "popupAbsolute", "animate", "stateTitle", "stateIndex", "stateField", "class", "style"],
		$scrollable: ["tag", "fallthrough", "class"],
		$select: ["tiddler", "field", "index", "default", "multiple", "size", "actions", "class"],
		$set: ["name", "value", "filter", "select", "tiddler", "field", "index", "emptyValue"],
		$setvariable: ["name", "value", "filter", "select", "tiddler", "field", "index", "emptyValue"],
		$slot: ["$name", "$depth"],
		$text: ["text"],
		$tiddler: ["tiddler"],
		$transclude: ["$tiddler", "$field", "$index", "$subtiddler", "$mode", "$type", "$output", "$recursionMarker", "$variable", "$fillignore"],
		$type: ["type", "text", "tiddler", "field", "index", "mode"],
		$vars: [],
		$view: ["tiddler", "field", "index", "format", "template", "subtiddler", "mode"],
		$wikify: ["name", "text", "type", "mode", "output"]
	};

function Dn(e, t) {
	return n => {
		const {
			state: r,
			pos: i
		} = n, s = /<\$[\w\-\.]*$/.exec(r.sliceDoc(i - 50, i));
		if(!s) return null;
		let o = a.syntaxTree(r).resolveInner(i, -1);
		for(; o && !o.type.isTop;) {
			if("FencedCode" === o.name || "CodeBlock" === o.name || "TypedBlock" === o.name || "CommentBlock" === o.name) return null;
			o = o.parent
		}
		const l = new Set(Cn);
		if(t)
			for(const e of t()) l.add(e);
		const c = new Set,
			d = [],
			u = lr(r.doc.toString());
		for(const e of u.widgets) c.has(e) || (c.add(e), d.push({
			name: e,
			detail: "widget (local)"
		}));
		const f = e ? e() : [],
			p = f.length > 0 ? f : Fn;
		for(const e of p)
			if(!c.has(e)) {
				c.add(e);
				const t = l.has(e);
				d.push({
					name: e,
					detail: t ? "action" : "widget"
				})
			} const h = s[0].length,
			m = d.map(({
				name: e,
				detail: t
			}) => {
				const n = l.has(e);
				return {
					label: "<" + e,
					type: "keyword",
					detail: t,
					apply: (t, r, i, s) => {
						const a = "<" + e,
							o = t.state.sliceDoc(s, s + 1);
						let l, c;
						if(n) l = a + "/>", c = a.length;
						else {
							l = a + ">" + ("</" + e + ">"), c = a.length + 1
						}
						const d = Ln(t, i, ">" === o ? s + 1 : s, l, h);
						t.dispatch({
							changes: d,
							selection: {
								anchor: i + c
							}
						})
					}
				}
			});
		return {
			from: i - s[0].length,
			to: i,
			options: m,
			validFor: /^<\$[\w\-\.]*$/
		}
	}
}

function Nn(e, t) {
	return n => {
		const {
			state: r,
			pos: i
		} = n, s = r.sliceDoc(Math.max(0, i - 200), i), o = /<\$([a-zA-Z][a-zA-Z0-9\-\.]*)\s+[^>]*$/.exec(s);
		if(!o) return null;
		const l = "$" + o[1],
			c = s.slice(s.lastIndexOf("<"));
		let d = !1,
			u = "";
		for(const e of c) d || '"' !== e && "'" !== e ? d && e === u && (d = !1) : (d = !0, u = e);
		if(d) return null;
		const f = /\s([$a-zA-Z\-]*)$/.exec(s);
		if(!f) return null;
		const p = f[1],
			h = i - p.length;
		let m = a.syntaxTree(r).resolveInner(i, -1);
		for(; m && !m.type.isTop;) {
			if("FencedCode" === m.name || "CodeBlock" === m.name || "TypedBlock" === m.name || "CommentBlock" === m.name) return null;
			m = m.parent
		}
		const g = t ? t(l) : null,
			k = On[l] || [];
		let x = null !== g ? [...g] : [...k];
		if("$macrocall" === l || "$transclude" === l) {
			const t = new RegExp(("$macrocall" === l ? "\\$name" : "\\$variable") + "\\s*=\\s*(?:\"([^\"]+)\"|'([^']+)'|<<([^>]+)>>)").exec(c);
			if(t) {
				const n = t[1] || t[2] || t[3];
				if(n) {
					const t = lr(r.doc.toString());
					let i = null;
					if(t.definitionParams[n] ? i = t.definitionParams[n] : e && (i = e(n)), i && i.length > 0) {
						const e = new Set(x);
						for(const t of i) e.has(t) || x.push(t)
					}
				}
			}
		}
		const b = p.length,
			y = x.map(e => ({
				label: e,
				type: "property",
				detail: e.startsWith("$") ? "widget attr" : "parameter",
				apply: (t, n, r, i) => {
					const s = '"' === t.state.sliceDoc(i, i + 1),
						a = s ? e + '="' : e + '=""',
						o = s ? i + 1 : i,
						l = r + e.length + 2,
						c = Ln(t, r, o, a, b);
					t.dispatch({
						changes: c,
						selection: {
							anchor: l
						},
						effects: Tn.of(null)
					})
				}
			}));
		return {
			from: h,
			to: i,
			options: y,
			validFor: /^[$a-zA-Z\-]*$/
		}
	}
}

function Hn(e, t, n, r, i, s, o, l) {
	return c => {
		const {
			state: d,
			pos: u
		} = c, f = d.sliceDoc(Math.max(0, u - 200), u), p = /([$a-zA-Z][\w\-]*)\s*=\s*(["'])([^"']*)$/.exec(f);
		if(!p) return null;
		const h = p[1],
			m = p[2],
			g = p[3],
			k = u - g.length,
			x = g.length;
		let b = a.syntaxTree(d).resolveInner(u, -1),
			y = !1;
		for(; b && !b.type.isTop;) {
			if("FencedCode" === b.name || "CodeBlock" === b.name || "TypedBlock" === b.name || "CommentBlock" === b.name) return null;
			"Widget" !== b.name && "InlineWidget" !== b.name && "HTMLTag" !== b.name && "HTMLBlock" !== b.name || (y = !0), b = b.parent
		}
		if(!y) return null;
		let w = [],
			$ = "";
		if("$variable" === h) {
			const t = new Set,
				i = [],
				s = lr(d.doc.toString());
			for(const e of s.macros) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "macro (local)",
				type: "function"
			}));
			for(const e of s.procedures) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "procedure (local)",
				type: "function"
			}));
			for(const e of s.functions) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "function (local)",
				type: "function"
			}));
			for(const e of s.widgetVars) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "variable (local)",
				type: "variable"
			}));
			for(const e of s.builtIns) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "variable (built-in)",
				type: "keyword"
			}));
			const a = e ? e() : [],
				o = a.length > 0 ? a : Wn;
			for(const e of o) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "macro",
				type: "function"
			}));
			const l = n ? n() : [];
			for(const e of l) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "function",
				type: "function"
			}));
			const c = r ? r() : [];
			for(const e of c) t.has(e) || (t.add(e), i.push({
				name: e,
				detail: "variable",
				type: "variable"
			}));
			const u = g.toLowerCase();
			w = i.filter(({
				name: e
			}) => e.toLowerCase().startsWith(u)).map(({
				name: e,
				detail: t,
				type: n
			}) => ({
				label: e,
				type: n,
				detail: t,
				boost: 2,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("tiddler" === h || "$tiddler" === h) {
			const e = t ? t() : [];
			if(0 === e.length) return null;
			$ = "tiddler", w = e.map(e => ({
				label: e,
				type: "variable",
				detail: $,
				boost: In(e),
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("to" === h || "$to" === h) {
			const e = t ? t() : [];
			if(0 === e.length) return null;
			$ = "tiddler", w = e.map(e => ({
				label: e,
				type: "variable",
				detail: $,
				boost: In(e),
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("$message" === h || "message" === h) {
			const e = g.toLowerCase(),
				t = zn.filter(t => t.toLowerCase().startsWith(e));
			$ = "message", w = t.map(e => ({
				label: e,
				type: "keyword",
				detail: $,
				boost: 2,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("$field" === h || "field" === h) {
			const e = i ? i() : jn,
				t = g.toLowerCase(),
				n = e.filter(e => e.toLowerCase().startsWith(t));
			$ = "field", w = n.map(e => ({
				label: e,
				type: "property",
				detail: $,
				boost: 2,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("$index" === h || "index" === h) {
			if(s) {
				const e = f.lastIndexOf("<"),
					t = e >= 0 ? f.slice(e) : f,
					n = /(?:\$tiddler|tiddler)\s*=\s*(["'])([^"']*)\1/.exec(t);
				if(n) {
					const e = n[2],
						t = s(e);
					if(t.length > 0) {
						const e = g.toLowerCase(),
							n = t.filter(t => t.toLowerCase().startsWith(e));
						$ = "index", w = n.map(e => ({
							label: e,
							type: "property",
							detail: $,
							boost: 2,
							apply: (t, n, r, i) => {
								const s = t.state.sliceDoc(i, i + 1),
									a = e + (s === m ? "" : m),
									o = Ln(t, r, i, a, x);
								t.dispatch({
									changes: o,
									selection: {
										anchor: r + a.length
									}
								})
							}
						}))
					}
				}
			}
		} else if("storyview" === h) {
			const e = o ? o() : Rn,
				t = g.toLowerCase(),
				n = e.filter(e => e.toLowerCase().startsWith(t));
			$ = "storyview", w = n.map(e => ({
				label: e,
				type: "keyword",
				detail: $,
				boost: 2,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("deserializer" === h) {
			const e = l ? l() : _n,
				t = g.toLowerCase(),
				n = e.filter(e => e.toLowerCase().startsWith(t));
			$ = "deserializer", w = n.map(e => ({
				label: e,
				type: "keyword",
				detail: $,
				boost: 2,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		} else if("$name" === h) {
			const t = new Set,
				n = [],
				r = lr(d.doc.toString());
			for(const e of r.macros) t.has(e) || (t.add(e), n.push({
				name: e,
				detail: "macro (local)"
			}));
			for(const e of r.procedures) t.has(e) || (t.add(e), n.push({
				name: e,
				detail: "procedure (local)"
			}));
			for(const e of r.functions) t.has(e) || (t.add(e), n.push({
				name: e,
				detail: "function (local)"
			}));
			for(const e of r.widgets) t.has(e) || (t.add(e), n.push({
				name: e,
				detail: "widget (local)"
			}));
			const i = e ? e() : Wn;
			for(const e of i) t.has(e) || (t.add(e), n.push({
				name: e,
				detail: "macro"
			}));
			const s = g.toLowerCase();
			w = n.filter(({
				name: e
			}) => e.toLowerCase().startsWith(s)).map(({
				name: e,
				detail: t
			}) => ({
				label: e,
				type: "function",
				detail: t,
				boost: 2,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 1),
						a = e + (s === m ? "" : m),
						o = Ln(t, r, i, a, x);
					t.dispatch({
						changes: o,
						selection: {
							anchor: r + a.length
						}
					})
				}
			}))
		}
		return 0 === w.length ? null : {
			from: k,
			to: u,
			options: w,
			validFor: /^[\w\-$:\/. ]*$/
		}
	}
}
const Wn = ["now", "tag", "tabs", "timeline", "toc", "toc-hierarchical", "toc-selective-expandable", "list-links", "list-links-draggable", "list-tagged-draggable", "copy-to-clipboard", "colour-picker", "image-picker", "keyboard-shortcut", "dumpvariables", "qualify", "csvtiddlers", "jsontiddlers", "datauri", "makedatauri", "translink"],
	Rn = ["classic", "pop", "zoomin"],
	_n = ["application/javascript", "application/json", "application/x-tiddler", "application/x-tiddler-html-div", "application/x-tiddlers", "text/css", "text/html", "text/plain", "text/vnd.tiddlywiki"],
	zn = ["tm-add-field", "tm-add-tag", "tm-auto-save-wiki", "tm-browser-refresh", "tm-cancel-tiddler", "tm-clear-password", "tm-close-all-tiddlers", "tm-close-all-windows", "tm-close-other-tiddlers", "tm-close-tiddler", "tm-close-window", "tm-copy-to-clipboard", "tm-delete-tiddler", "tm-download-file", "tm-edit-bitmap-operation", "tm-edit-text-operation", "tm-edit-tiddler", "tm-focus-selector", "tm-fold-all-tiddlers", "tm-fold-other-tiddlers", "tm-fold-tiddler", "tm-full-screen", "tm-home", "tm-http-cancel-all-requests", "tm-http-request", "tm-import-tiddlers", "tm-load-plugin-from-library", "tm-load-plugin-library", "tm-login", "tm-logout", "tm-modal", "tm-navigate", "tm-new-tiddler", "tm-notify", "tm-open-external-window", "tm-open-window", "tm-perform-import", "tm-permalink", "tm-permaview", "tm-print", "tm-relink-tiddler", "tm-remove-field", "tm-remove-tag", "tm-rename-tiddler", "tm-save-tiddler", "tm-save-wiki", "tm-scroll", "tm-server-refresh", "tm-set-password", "tm-unfold-all-tiddlers", "tm-unload-plugin-library"],
	Vn = ["all", "title", "field", "tag", "has", "is", "indexes", "fields", "tags", "links", "backlinks", "list", "listed", "tagging", "untagged", "prefix", "suffix", "contains", "match", "regexp", "search", "trim", "lowercase", "uppercase", "titlecase", "sentencecase", "splitbefore", "split", "join", "stringify", "compare", "minlength", "maxlength", "first", "last", "nth", "limit", "rest", "butlast", "range", "sort", "nsort", "sortby", "nsortby", "reverse", "count", "unique", "duplicates", "allafter", "allbefore", "after", "before", "prepend", "append", "insertbefore", "move", "putafter", "putbefore", "putfirst", "putlast", "remove", "replace", "toggle", "cycle", "add", "subtract", "multiply", "divide", "negate", "abs", "ceil", "floor", "round", "trunc", "sign", "min", "max", "average", "sum", "product", "log", "power", "sqrt", "exp", "fixed", "precision", "remainder", "random", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "now", "format", "days", "weeks", "months", "years", "hours", "minutes", "seconds", "milliseconds", "adddays", "subtractdays", "year", "month", "day", "hour", "minute", "second", "get", "getindex", "getvariable", "lookup", "jsonget", "jsonindexes", "jsontype", "jsonextract", "jsonstringify", "encodehtml", "decodehtml", "encodeuri", "encodeuricomponent", "decodeuri", "decodeuricomponent", "escaperegexp", "escapecss", "base64encode", "base64decode", "each", "eachday", "filter", "reduce", "map", "subfilter", "else", "then", "variables", "modules", "plugintiddlers", "shadowsource", "storyviews", "editions", "lengths", "commands", "sha256hash", "md5hash", "encryptbase64", "decryptbase64", "draft.of", "draft.for", "draft", "draftof", "draftfor"],
	Zn = [{
		label: "+",
		detail: "intersection - filter the input (same as :and)"
	}, {
		label: "-",
		detail: "subtraction - remove from results (same as :except)"
	}, {
		label: "~",
		detail: "else - use if previous was empty (same as :else)"
	}, {
		label: "=",
		detail: "literal - add title literally (same as :all)"
	}, {
		label: ":and",
		detail: "intersection - same as +"
	}, {
		label: ":except",
		detail: "subtraction - same as -"
	}, {
		label: ":else",
		detail: "else - same as ~"
	}, {
		label: ":all",
		detail: "literal - same as ="
	}, {
		label: ":filter",
		detail: "filter each title through subfilter"
	}, {
		label: ":map",
		detail: "transform each title via subfilter"
	}, {
		label: ":reduce",
		detail: "reduce to single value"
	}, {
		label: ":intersection",
		detail: "keep titles common to all runs"
	}, {
		label: ":cascade",
		detail: "cascade through filters"
	}, {
		label: ":some",
		detail: "pass to any matching run"
	}, {
		label: ":sort",
		detail: "sort by subfilter result"
	}, {
		label: ":flat",
		detail: "flatten list output"
	}],
	jn = ["title", "text", "tags", "modified", "created", "creator", "modifier", "type", "caption", "description", "list", "list-before", "list-after", "draft.of", "draft.title", "plugin-type", "plugin-priority", "color", "icon", "library", "source", "code-body", "throttle.refresh"],
	Kn = {
		all: {
			operands: ["current", "missing", "orphans", "shadows", "tags", "tiddlers"],
			allowPlus: !0
		},
		is: {
			operands: ["binary", "blank", "current", "draft", "image", "missing", "orphan", "shadow", "system", "tag", "tiddler", "variable"]
		},
		has: {
			dynamicOperands: "fields",
			suffixes: ["field", "index", "tag"]
		},
		get: {
			dynamicOperands: "fields"
		},
		getindex: {
			dynamicOperands: "fields"
		},
		field: {
			dynamicOperands: "fields"
		},
		fields: {
			operands: []
		},
		indexes: {
			operands: []
		},
		tag: {
			dynamicOperands: "tags"
		},
		tagging: {
			operands: []
		},
		tags: {
			operands: []
		},
		untagged: {
			operands: []
		},
		function: {
			dynamicOperands: "functions"
		},
		subfilter: {
			dynamicOperands: "functions"
		},
		contains: {
			flags: ["casesensitive"],
			suffixes: ["field", "index"]
		},
		match: {
			flags: ["casesensitive"]
		},
		regexp: {
			flags: ["casesensitive"]
		},
		search: {
			flags: ["casesensitive", "anchored", "literal", "whitespace", "regexp", "words", "some", "all"],
			suffixes: ["field"]
		},
		prefix: {
			flags: ["casesensitive"]
		},
		suffix: {
			flags: ["casesensitive"]
		},
		sort: {
			dynamicOperands: "fields",
			flags: ["reverse", "casesensitive"],
			suffixes: ["alphanumeric", "number", "string", "date", "naturaldate"]
		},
		nsort: {
			dynamicOperands: "fields",
			flags: ["reverse"]
		},
		sortan: {
			dynamicOperands: "fields",
			flags: ["reverse"]
		},
		sortcs: {
			dynamicOperands: "fields",
			flags: ["reverse"]
		},
		sortby: {
			dynamicOperands: "fields",
			flags: ["reverse"]
		},
		nsortby: {
			dynamicOperands: "fields",
			flags: ["reverse"]
		},
		compare: {
			suffixes: ["number", "string", "integer", "date", "version"],
			flags: ["casesensitive"]
		},
		limit: {
			operands: []
		},
		first: {
			operands: []
		},
		last: {
			operands: []
		},
		nth: {
			operands: []
		},
		range: {
			operands: []
		},
		format: {
			operands: ["date", "relativedate", "json", "timestamp", "titlelist"]
		},
		jsonget: {
			operands: []
		},
		jsontype: {
			operands: []
		},
		jsonindexes: {
			operands: []
		},
		jsonextract: {
			operands: []
		},
		lookup: {
			dynamicOperands: "fields"
		},
		getvariable: {
			dynamicOperands: "variables"
		},
		list: {
			dynamicOperands: "tiddlers"
		},
		listed: {
			dynamicOperands: "fields"
		},
		enlist: {
			operands: []
		},
		split: {
			operands: []
		},
		"draft.of": {
			operands: []
		},
		"draft.for": {
			operands: []
		},
		each: {
			dynamicOperands: "fields"
		},
		eachday: {
			dynamicOperands: "fields"
		},
		backlinks: {
			operands: []
		},
		backtranscludes: {
			operands: []
		},
		commands: {
			operands: []
		},
		count: {
			operands: []
		},
		deserializers: {
			operands: []
		},
		duplicateslugs: {
			operands: []
		},
		editions: {
			operands: []
		},
		haschanged: {
			operands: []
		},
		links: {
			operands: []
		},
		moduletypes: {
			operands: []
		},
		plugintiddlers: {
			operands: []
		},
		shadowsource: {
			operands: []
		},
		slugify: {
			operands: []
		},
		storyviews: {
			operands: []
		},
		title: {
			operands: []
		},
		transcludes: {
			operands: []
		},
		variables: {
			operands: []
		}
	};

function Un(e, t, n) {
	return r => {
		const {
			state: i,
			pos: s
		} = r, o = i.sliceDoc(s - 50, s), l = /<<[\w\-\.]*$/.exec(o);
		if(l && "<" === o[l.index - 1]) return null;
		const c = /[\[\]}>][\w\-:!]*<[\w\-\.]*$/.exec(o),
			d = l || c;
		if(!d) return null;
		let u = a.syntaxTree(i).resolveInner(s, -1);
		for(; u && !u.type.isTop;) {
			if("FencedCode" === u.name || "CodeBlock" === u.name || "TypedBlock" === u.name || "CommentBlock" === u.name) return null;
			u = u.parent
		}
		const f = new Set,
			p = [],
			h = lr(i.doc.toString());
		for(const e of h.macros) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "macro (local)",
			type: "function"
		}));
		for(const e of h.procedures) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "procedure (local)",
			type: "function"
		}));
		for(const e of h.functions) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "function (local)",
			type: "function"
		}));
		for(const e of h.widgetVars) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "variable (local)",
			type: "variable"
		}));
		for(const e of h.builtIns) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "variable (built-in)",
			type: "keyword"
		}));
		const m = e ? e() : [],
			g = m.length > 0 ? m : Wn;
		for(const e of g) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "macro",
			type: "function"
		}));
		const k = t ? t() : [];
		for(const e of k) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "function",
			type: "function"
		}));
		const x = n ? n() : [];
		for(const e of x) f.has(e) || (f.add(e), p.push({
			name: e,
			detail: "variable",
			type: "variable"
		}));
		if(c) {
			const e = d[0].slice(0, d[0].lastIndexOf("<") + 1),
				t = c[0].length,
				n = p.map(({
					name: n,
					detail: r,
					type: i
				}) => ({
					label: e + n,
					type: i,
					detail: r,
					apply: (r, i, s, a) => {
						const o = r.state.sliceDoc(a, a + 2),
							l = ">" === o[0],
							c = "]" === o[1] || "]" === o[0];
						let d = ">]";
						l && c ? d = "" : l ? d = "]" : c && (d = ">");
						const u = e + n + d,
							f = s + e.length + n.length + 1,
							p = Ln(r, s, a, u, t);
						r.dispatch({
							changes: p,
							selection: {
								anchor: f
							}
						})
					}
				}));
			return {
				from: s - c[0].length,
				to: s,
				options: n,
				validFor: /^[\[\]}>][\w\-:!]*<[\w\-\.]*$/
			}
		}
		const b = p.map(({
			name: e,
			detail: t,
			type: n
		}) => ({
			label: "<<" + e,
			type: n,
			detail: t,
			apply: "<<" + e + ">>"
		}));
		return {
			from: s - d[0].length,
			to: s,
			options: b,
			validFor: /^<<[\w\-\.]*$/
		}
	}
}

function Qn(e) {
	return t => {
		const {
			state: n,
			pos: r
		} = t, i = n.sliceDoc(Math.max(0, r - 200), r), s = /<<([\w\-\.]+)\s+[^>]*$/.exec(i), o = /<\$macrocall\s+[^>]*\$name=(?:"([^"]+)"|'([^']+)'|<<([^>]+)>>)[^>]*$/.exec(i);
		let l = null;
		if(s ? l = s[1] : o && (l = o[1] || o[2] || o[3]), !l) return null;
		const c = s ? i.slice(i.lastIndexOf("<<")) : i.slice(i.lastIndexOf("<$macrocall"));
		let d = !1,
			u = "";
		for(const e of c) d || '"' !== e && "'" !== e ? d && e === u && (d = !1) : (d = !0, u = e);
		if(d) return null;
		const f = /\s([$\w\-]*)$/.exec(i);
		if(!f) return null;
		const p = r - f[1].length;
		let h = a.syntaxTree(n).resolveInner(r, -1);
		for(; h && !h.type.isTop;) {
			if("FencedCode" === h.name || "CodeBlock" === h.name || "TypedBlock" === h.name || "CommentBlock" === h.name) return null;
			h = h.parent
		}
		const m = lr(n.doc.toString());
		let g = null;
		if(m.definitionParams[l] ? g = m.definitionParams[l] : e && (g = e(l)), !g || 0 === g.length) return null;
		return {
			from: p,
			to: r,
			options: g.map(e => ({
				label: e,
				type: "property",
				detail: "parameter",
				apply: e + ":"
			})),
			validFor: /^[$\w\-]*$/
		}
	}
}

function qn(e, t) {
	return n => {
		const {
			state: r,
			pos: i
		} = n, s = r.sliceDoc(Math.max(0, i - 100), i), o = /\[\[[^\]|]*$/.exec(s), l = /\[\[.*?\|[^\]]*$/.exec(s);
		let c = /(?<!\{)\{\{[^{}|]*$/.exec(s);
		c && (c[0].includes("!!") || c[0].includes("##")) && (c = null);
		const d = /\[img(?:\s+[^\[]*)?\[[^\]|]*$/.exec(s),
			u = /\[ext\[[^\]|]*$/.exec(s),
			f = /[\[\]}>][\w\-:!]*\[[^\]]*$/.exec(s);
		let p = /[\[\]}>][\w\-:!]*\{[^}]*$/.exec(s);
		p && (p[0].includes("!!") || p[0].includes("##")) && (p = null);
		const h = /\{\{\{[^}]*$/.test(s) || /\bfilter\s*=\s*(?:"[^"]*|'[^']*|"""[^"]*)$/.test(s) || /<\$\w+[^>]*\bfilter\s*=\s*(?:"[^"]*|'[^']*|"""[^"]*)$/.test(s);
		let m;
		if(d) m = d;
		else {
			if(u) return null;
			m = h && o && f ? f : o || l || c || f || p
		}
		if(!m) return null;
		let g = a.syntaxTree(r).resolveInner(i, -1),
			k = !1,
			x = !1;
		for(; g && !g.type.isTop;) {
			if("FencedCode" === g.name || "CodeBlock" === g.name || "TypedBlock" === g.name || "CommentBlock" === g.name) return null;
			"ImageLink" !== g.name && "ImageSource" !== g.name || (k = !0), "ExternalLink" !== g.name && "URLLink" !== g.name || (x = !0), g = g.parent
		}
		if(x) return null;
		k && d && (m = d);
		let b, y, w, $, T = e ? e() : [];
		if(0 === T.length) return null;
		if(m === p) {
			b = m[0].slice(0, m[0].lastIndexOf("{") + 1), w = /^[\[\]}>][\w\-:!]*\{[^}]*$/, $ = "text reference";
			const e = m[0].length,
				t = T.map(t => ({
					label: b + t,
					type: "variable",
					detail: $,
					boost: In(t),
					apply: (n, r, i, s) => {
						const a = n.state.sliceDoc(s, s + 2),
							o = "}" === a[0],
							l = !("]" === a[1] || "]" === a[0] || o && "]" === a[1]),
							c = b + t + (o ? "" : "}") + (l ? "]" : ""),
							d = i + b.length + t.length + 1,
							u = Ln(n, i, s, c, e);
						n.dispatch({
							changes: u,
							selection: {
								anchor: d
							}
						})
					}
				}));
			return {
				from: i - m[0].length,
				to: i,
				options: t,
				validFor: w
			}
		}
		if(m === d) {
			const e = m[0].lastIndexOf("[");
			if(b = m[0].slice(0, e + 1), y = "]]", w = /^\[img(?:\s+[^\[]*)?\[[^\]|]*$/, $ = "image", t) {
				const e = t();
				e.length > 0 && (T = e)
			}
		} else {
			if(m === f) {
				const e = /[\[\]}>](!?)([\w.]+)(?::[\w]+)*\[[^\]]*$/.exec(m[0]);
				if(e) {
					const t = e[2];
					if(Kn[t]) return null
				}
				b = m[0].slice(0, m[0].lastIndexOf("[") + 1), w = /^[\[\]}>][\w\-:!]*\[[^\]]*$/, $ = "filter operand";
				const t = m[0].length,
					n = T.map(e => ({
						label: b + e,
						type: "variable",
						detail: $,
						boost: In(e),
						apply: (n, r, i, s) => {
							const a = n.state.sliceDoc(s, s + 2),
								o = "]" === a[0],
								l = "]" === a[1];
							let c = "]]";
							o && l ? c = "" : o && (c = "]");
							const d = b + e + c,
								u = i + b.length + e.length + 1,
								f = Ln(n, i, s, d, t);
							n.dispatch({
								changes: f,
								selection: {
									anchor: u
								}
							})
						}
					}));
				return {
					from: i - m[0].length,
					to: i,
					options: n,
					validFor: w
				}
			}
			if(m === o) b = "[[", y = "]]", w = /^\[\[[^\]|]*$/, $ = "tiddler";
			else if(m === l) {
				const e = m[0].lastIndexOf("|");
				b = m[0].slice(0, e + 1), y = "]]", w = /^\[\[.*?\|[^\]]*$/, $ = "tiddler"
			} else {
				if(m !== c) return null;
				b = "{{", y = "}}", w = /^(?<!\{)\{\{[^{}|]*$/, $ = "tiddler"
			}
		}
		const M = m[0].length,
			S = T.map(e => ({
				label: b + e,
				type: "variable",
				detail: $,
				boost: In(e),
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + y.length);
					let a = y,
						o = 0;
					s === y ? (a = "", o = y.length) : "]]" === y && s.startsWith("]") ? (a = "]", o = 1) : "}}" === y && s.startsWith("}") && (a = "}", o = 1);
					const l = b + e + a,
						c = r + l.length + o,
						d = Ln(t, r, i, l, M);
					t.dispatch({
						changes: d,
						selection: {
							anchor: c
						}
					})
				}
			}));
		return {
			from: i - m[0].length,
			to: i,
			options: S,
			validFor: w
		}
	}
}

function Gn(e, t) {
	return n => {
		const {
			state: r,
			pos: i
		} = n, s = r.sliceDoc(Math.max(0, i - 200), i), o = /(?<!\{)\{\{([^{}|]*?)!![^{}|!]*$/.exec(s), l = /(?<!\{)\{\{([^{}|]*?)##[^{}|#]*$/.exec(s);
		let c = null,
			d = null;
		(/\[[^\]]*\{[^{}]*$/.test(s) || /\{\{\{[^}]*\{[^{}]*$/.test(s) || /\bfilter\s*=\s*(?:"[^"]*|'[^']*|"""[^"]*)\{[^{}]*$/.test(s)) && (c = /(?<!\{)\{(?!\{)([^{}]*?)!![^{}!]*$/.exec(s), d = /(?<!\{)\{(?!\{)([^{}]*?)##[^{}#]*$/.exec(s));
		const u = !(!o && !l),
			f = !(!o && !c),
			p = o || l || c || d;
		if(!p) return null;
		let h = a.syntaxTree(r).resolveInner(i, -1);
		for(; h && !h.type.isTop;) {
			if("FencedCode" === h.name || "CodeBlock" === h.name || "TypedBlock" === h.name || "CommentBlock" === h.name) return null;
			h = h.parent
		}
		const m = f ? "!!" : "##",
			g = p[1] || "",
			k = p[0].lastIndexOf(m),
			x = p[0].slice(0, k + 2),
			b = p[0].slice(k + 2);
		let y, w;
		f ? (y = e && g ? e(g) : [], w = "field") : (y = t && g ? t(g) : [], w = "index");
		const $ = y.filter(e => e.toLowerCase().startsWith(b.toLowerCase()));
		if(0 === $.length) return null;
		const T = p[0].length,
			M = u ? "}}" : "}",
			S = $.map(e => ({
				label: x + e,
				type: "property",
				detail: w,
				apply: (t, n, r, i) => {
					const s = t.state.sliceDoc(i, i + 2);
					let a = M;
					u ? "}}" === s ? a = "" : s.startsWith("}") && (a = "}") : s.startsWith("}") && (a = "");
					const o = x + e + a,
						l = r + o.length,
						c = Ln(t, r, i, o, T);
					t.dispatch({
						changes: c,
						selection: {
							anchor: l
						}
					})
				}
			}));
		let C;
		return C = u ? f ? /^(?<!\{)\{\{[^{}|]*!![^{}|!]*$/ : /^(?<!\{)\{\{[^{}|]*##[^{}|#]*$/ : f ? /^(?<!\{)\{(?!\{)[^{}]*!![^{}!]*$/ : /^(?<!\{)\{(?!\{)[^{}]*##[^{}#]*$/, {
			from: i - p[0].length,
			to: i,
			options: S,
			validFor: C
		}
	}
}
const Jn = ["div", "span", "p", "a", "img", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "dl", "dt", "dd", "table", "tr", "td", "th", "thead", "tbody", "tfoot", "form", "input", "button", "select", "option", "textarea", "label", "header", "footer", "nav", "main", "section", "article", "aside", "strong", "em", "b", "i", "u", "s", "code", "pre", "blockquote", "iframe", "video", "audio", "source", "canvas", "svg", "script", "style", "link", "meta"];

function Xn(e) {
	const {
		state: t,
		pos: n
	} = e, r = /<[:\-\.\w\u00b7-\uffff]*$/.exec(t.sliceDoc(n - 25, n));
	if(!r) return null;
	if(r[0].startsWith("<$")) return null;
	let i = a.syntaxTree(t).resolveInner(n, -1);
	for(; i && !i.type.isTop;) {
		if("FencedCode" === i.name || "CodeBlock" === i.name || "TypedBlock" === i.name || "CommentBlock" === i.name) return null;
		i = i.parent
	}
	const s = r[0].length,
		o = Jn.map(e => {
			const t = Sn.has(e);
			return {
				label: "<" + e,
				type: "type",
				detail: t ? "self-closing" : "tag",
				apply: (n, r, i, a) => {
					const o = "<" + e,
						l = ">" === n.state.sliceDoc(a, a + 1) ? a + 1 : a;
					let c, d;
					if(t) c = o + ">", d = c.length;
					else {
						c = o + ">" + ("</" + e + ">"), d = o.length + 1
					}
					const u = Ln(n, i, l, c, s);
					n.dispatch({
						changes: u,
						selection: {
							anchor: i + d
						}
					})
				}
			}
		});
	return {
		from: n - r[0].length,
		to: n,
		options: o,
		validFor: /^<[:\-\.\w\u00b7-\uffff]*$/
	}
}
const Yn = ["class", "id", "style", "title", "lang", "dir", "hidden", "tabindex", "accesskey", "contenteditable", "draggable", "spellcheck", "translate", "data-", "aria-", "role"],
	er = {
		a: ["href", "target", "rel", "download", "hreflang", "type"],
		img: ["src", "alt", "width", "height", "loading", "srcset", "sizes"],
		input: ["type", "name", "value", "placeholder", "required", "disabled", "readonly", "checked", "maxlength", "minlength", "pattern", "min", "max", "step"],
		button: ["type", "disabled", "name", "value", "form"],
		form: ["action", "method", "enctype", "target", "autocomplete", "novalidate"],
		label: ["for"],
		select: ["name", "multiple", "required", "disabled", "size"],
		option: ["value", "selected", "disabled"],
		textarea: ["name", "rows", "cols", "placeholder", "required", "disabled", "readonly", "maxlength", "minlength"],
		link: ["href", "rel", "type", "media"],
		script: ["src", "type", "async", "defer", "crossorigin"],
		meta: ["name", "content", "charset", "http-equiv"],
		iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "sandbox"],
		video: ["src", "width", "height", "controls", "autoplay", "loop", "muted", "poster", "preload"],
		audio: ["src", "controls", "autoplay", "loop", "muted", "preload"],
		source: ["src", "type", "media", "srcset", "sizes"],
		table: ["border", "cellpadding", "cellspacing"],
		td: ["colspan", "rowspan", "headers"],
		th: ["colspan", "rowspan", "headers", "scope"],
		div: [],
		span: [],
		p: []
	};

function tr(e) {
	const {
		state: t,
		pos: n
	} = e, r = t.sliceDoc(Math.max(0, n - 200), n), i = /<([a-zA-Z][a-zA-Z0-9]*)\s+[^>]*$/.exec(r);
	if(!i) return null;
	const s = r.length - i[0].length;
	if(s > 0 && "<" === r[s - 1]) return null;
	const o = i[1].toLowerCase();
	if(o.startsWith("$")) return null;
	const l = r.slice(r.lastIndexOf("<"));
	let c = !1,
		d = "";
	for(const e of l) c || '"' !== e && "'" !== e ? c && e === d && (c = !1) : (c = !0, d = e);
	if(c) return null;
	const u = /\s([a-zA-Z\-]*)$/.exec(r);
	if(!u) return null;
	const f = u[1],
		p = n - f.length;
	let h = a.syntaxTree(t).resolveInner(n, -1);
	for(; h && !h.type.isTop;) {
		if("FencedCode" === h.name || "CodeBlock" === h.name || "TypedBlock" === h.name || "CommentBlock" === h.name) return null;
		h = h.parent
	}
	const m = er[o] || [],
		g = [...new Set([...m, ...Yn])],
		k = f.length,
		x = g.map(e => ({
			label: e,
			type: "property",
			apply: (t, n, r, i) => {
				if(e.endsWith("-")) {
					const n = Ln(t, r, i, e, k);
					return void t.dispatch({
						changes: n,
						selection: {
							anchor: r + e.length
						}
					})
				}
				const s = '"' === t.state.sliceDoc(i, i + 1),
					a = s ? e + '="' : e + '=""',
					o = s ? i + 1 : i,
					l = r + e.length + 2,
					c = Ln(t, r, o, a, k);
				t.dispatch({
					changes: c,
					selection: {
						anchor: l
					}
				})
			}
		}));
	return {
		from: p,
		to: n,
		options: x,
		validFor: /^[a-zA-Z\-]*$/
	}
}

function nr(e) {
	return t => {
		const {
			state: n,
			pos: r
		} = t, i = n.sliceDoc(Math.max(0, r - 100), r);
		if(/[\[\]}>][\w\-:!]*\[[^\]]*$/.test(i) || /[\[\]}>][\w\-:!]*\{[^}]*$/.test(i) || /[\[\]}>][\w\-:!]*<[^>]*$/.test(i)) return null;
		const s = /\[(!?)(\w*)$/.exec(i);
		if(!s) {
			const n = /\][:\w]*(\w+)$/.exec(i);
			if(!n) return null;
			const r = n[1];
			return rr(t, r, r.length, e)
		}
		const o = a.syntaxTree(n).resolveInner(r, -1);
		let l = o,
			c = !1;
		for(; l && !l.type.isTop;) {
			if("FencedCode" === l.name || "CodeBlock" === l.name || "TypedBlock" === l.name || "CommentBlock" === l.name) return null;
			"FilterExpression" !== l.name && "FilteredTransclusion" !== l.name && "FilteredTransclusionBlock" !== l.name && "AttributeFiltered" !== l.name && "ConditionalBlock" !== l.name && "FilterRun" !== l.name && "FilterOperator" !== l.name && "FilterOperatorName" !== l.name || (c = !0), l = l.parent
		}
		if(!(c || /\{\{\{[^}]*$/.test(i) || /<%(?:if|elseif)\s+[^%]*$/.test(i) || /filter\s*=\s*["'][^"']*$/.test(i))) {
			let e = !1,
				t = o;
			for(; t && !t.type.isTop;) {
				if("Widget" === t.name || "WidgetBlock" === t.name || "MacroCall" === t.name || "MacroCallBlock" === t.name || "HTMLTag" === t.name || "HTMLBlock" === t.name || "Attribute" === t.name || "AttributeName" === t.name || "AttributeValue" === t.name || "AttributeString" === t.name || "PragmaImport" === t.name || "PragmaDefine" === t.name || "PragmaProcedure" === t.name || "PragmaFunction" === t.name || "PragmaWidget" === t.name || "PragmaParameters" === t.name || "WikiLink" === t.name || "ImageLink" === t.name || "Transclusion" === t.name || "TransclusionBlock" === t.name) {
					e = !0;
					break
				}
				t = t.parent
			}
			if(e) return null
		}
		const d = s[1],
			u = s[2];
		return rr(t, u, u.length + d.length + 1, e)
	}
}

function rr(e, t, n, r) {
	const {
		pos: i
	} = e, s = r ? r() : [], a = (s.length > 0 ? s : Vn).map(e => {
		const t = Kn[e];
		return t && Array.isArray(t.operands) && 0 === t.operands.length ? {
			label: e,
			type: "function",
			detail: "filter operator",
			apply: (t, n, r, i) => {
				if("]]" === t.state.sliceDoc(i, i + 2)) {
					const n = e + "[";
					t.dispatch({
						changes: {
							from: r,
							to: i,
							insert: n
						},
						selection: {
							anchor: r + n.length
						}
					})
				} else {
					const n = e + "[]";
					t.dispatch({
						changes: {
							from: r,
							to: i,
							insert: n
						},
						selection: {
							anchor: r + n.length
						}
					})
				}
			}
		} : {
			label: e,
			type: "function",
			detail: "filter operator",
			apply: e + "["
		}
	});
	return {
		from: i - t.length,
		to: i,
		options: a,
		validFor: /^\w*$/
	}
}

function ir(e) {
	const {
		state: t,
		pos: n
	} = e, r = t.sliceDoc(Math.max(0, n - 100), n), i = /(?:\{\{\{|[\]\s])\s*([:+\-~=][\w]*)$/.exec(r);
	if(!i) return null;
	let s = a.syntaxTree(t).resolveInner(n, -1),
		o = !1;
	for(; s && !s.type.isTop;) {
		if("FencedCode" === s.name || "CodeBlock" === s.name || "TypedBlock" === s.name || "CommentBlock" === s.name) return null;
		"FilterExpression" !== s.name && "FilteredTransclusion" !== s.name && "FilteredTransclusionBlock" !== s.name && "AttributeFiltered" !== s.name && "ConditionalBlock" !== s.name || (o = !0), s = s.parent
	}
	if(!(o || /\{\{\{[^}]*$/.test(r) || /<%(?:if|elseif)\s+[^%]*$/.test(r) || /filter\s*=\s*["'][^"']*$/.test(r))) return null;
	const l = i[1],
		c = Zn.map(e => ({
			label: e.label,
			type: "keyword",
			detail: e.detail,
			apply: e.label.startsWith(":") ? (t, n, r, i) => {
				const s = t.state.sliceDoc(i, i + 10),
					a = /^\s*\]/.test(s) ? e.label + "[" : e.label + "[]",
					o = r + e.label.length + 1;
				t.dispatch({
					changes: {
						from: r,
						to: i,
						insert: a
					},
					selection: {
						anchor: o
					}
				})
			} : e.label
		}));
	return {
		from: n - l.length,
		to: n,
		options: c,
		validFor: /^[:+\-~=][\w]*$/
	}
}

function sr(e) {
	return t => {
		const {
			state: n,
			pos: r
		} = t, i = n.sliceDoc(Math.max(0, r - 100), r), s = /\[(!?)([\w.]+)((?::[\w]*)*)$/.exec(i);
		if(!s) return null;
		const a = s[2],
			o = s[3];
		if(!o || !o.includes(":")) return null;
		const l = /:(\w*)$/.exec(o);
		if(!l) return null;
		const c = l[1],
			d = Kn[a];
		if(!d) return null;
		if(!d.flags && !d.suffixes) return null;
		const u = o.split(":").filter(e => e && e !== c),
			f = [];
		if(d.flags)
			for(const e of d.flags) u.includes(e) || f.push({
				label: e,
				type: "keyword",
				detail: "flag"
			});
		if(d.suffixes)
			for(const e of d.suffixes) u.includes(e) || ("field" === e ? f.push({
				label: e,
				type: "property",
				detail: "use field suffix"
			}) : f.push({
				label: e,
				type: "property",
				detail: "type"
			}));
		if(u.includes("field") || d.suffixes?.includes("field") && !u.some(e => d.suffixes?.includes(e) && "field" !== e)) {
			const t = e ? e() : jn;
			for(const e of t) u.includes(e) || f.push({
				label: e,
				type: "variable",
				detail: "field name"
			})
		}
		if(0 === f.length) return null;
		const p = c.length > 0 ? f.filter(e => e.label.toLowerCase().startsWith(c.toLowerCase())) : f;
		return 0 === p.length ? null : {
			from: r - c.length,
			to: r,
			options: p,
			validFor: /^\w*$/
		}
	}
}
const ar = ["transclusion", "currentTiddler", "storyTiddler", "tv-story-list", "tv-history-list", "tv-config-toolbar-icons", "tv-config-toolbar-text", "tv-config-toolbar-class", "tv-wikilinks", "tv-show-missing-links", "revealedTitle", "tv-tiddler-preview"];
let or = {
	text: "",
	result: null
};

function lr(e) {
	if(or.text === e && or.result) return or.result;
	const t = [],
		n = [],
		r = [],
		i = [],
		s = {},
		a = {},
		o = /\\(define|procedure|function|widget)\s+([^\s(]+)(?:\(([^)]*)\))?/g;
	let l;
	for(; null !== (l = o.exec(e));) {
		const e = l[1],
			o = l[2],
			c = l[3];
		if(!s[o]) {
			switch(s[o] = !0, e) {
				case "function":
					t.push(o);
					break;
				case "procedure":
					n.push(o);
					break;
				case "define":
					r.push(o);
					break;
				case "widget":
					i.push(o)
			}
			if(void 0 !== c && c.trim()) {
				const e = c.split(",").map(e => e.trim().split(":")[0].trim()).filter(e => e.length > 0);
				e.length > 0 && (a[o] = e)
			}
		}
	}
	const c = [],
		d = /<\$set\s+[^>]*name\s*=\s*["']([^"']+)["']/gi;
	for(; null !== (l = d.exec(e));) {
		const e = l[1];
		s[e] || (s[e] = !0, c.push(e))
	}
	const u = /<\$vars\s+([^>]+)>/gi;
	for(; null !== (l = u.exec(e));) {
		const e = l[1],
			t = /([a-zA-Z_][\w-]*)\s*=/g;
		let n;
		for(; null !== (n = t.exec(e));) {
			const e = n[1];
			s[e] || (s[e] = !0, c.push(e))
		}
	}
	const f = /<\$let\s+([^>]+)>/gi;
	for(; null !== (l = f.exec(e));) {
		const e = l[1],
			t = /([a-zA-Z_][\w-]*)\s*=/g;
		let n;
		for(; null !== (n = t.exec(e));) {
			const e = n[1];
			s[e] || (s[e] = !0, c.push(e))
		}
	}
	const p = /<\$list\s+[^>]*(?:variable|counter)\s*=\s*["']([^"']+)["']/gi;
	for(; null !== (l = p.exec(e));) {
		const e = l[1];
		s[e] || (s[e] = !0, c.push(e))
	}
	const h = /<\$range\s+[^>]*variable\s*=\s*["']([^"']+)["']/gi;
	for(; null !== (l = h.exec(e));) {
		const e = l[1];
		s[e] || (s[e] = !0, c.push(e))
	}
	const m = /<\$wikify\s+[^>]*name\s*=\s*["']([^"']+)["']/gi;
	for(; null !== (l = m.exec(e));) {
		const e = l[1];
		s[e] || (s[e] = !0, c.push(e))
	}
	const g = [...ar, ...t, ...n, ...r, ...i, ...c],
		k = {
			functions: t,
			procedures: n,
			macros: r,
			widgets: i,
			widgetVars: c,
			builtIns: ar,
			variables: g,
			definitionParams: a
		};
	return or = {
		text: e,
		result: k
	}, k
}

function cr(e, t, n, r, i) {
	return s => {
		const {
			state: a,
			pos: o
		} = s, l = a.sliceDoc(Math.max(0, o - 100), o), c = /[\[\]}>](!?)([\w.]+)((?::[\w]+)*)\[([^\]]*)$/.exec(l);
		if(!c) return null;
		const d = c[2],
			u = c[4],
			f = Kn[d];
		if(!f) return null;
		if(f.operands && 0 === f.operands.length && !f.dynamicOperands) return null;
		let p, h;
		if(f.allowPlus && u.includes("+")) {
			const e = u.split("+");
			p = e[e.length - 1], h = e.slice(0, -1)
		} else p = u, h = [];
		let m = [];
		if(f.operands && f.operands.length > 0 && (m = f.operands.filter(e => !h.includes(e)).map(e => ({
				label: e,
				type: "constant",
				detail: `${d}[] value`
			}))), f.dynamicOperands) {
			const s = lr(a.doc.toString());
			let o = [],
				l = [],
				c = "";
			switch(f.dynamicOperands) {
				case "fields":
					o = n ? n() : jn, c = "field";
					break;
				case "tags":
					o = t ? t() : [], c = "tag";
					break;
				case "tiddlers":
					o = e ? e() : [], c = "tiddler";
					break;
				case "functions":
					o = r ? r() : [], l = s.functions, c = "function";
					break;
				case "variables":
					o = i ? i() : [], l = s.variables, c = "variable"
			}
			const d = new Set(h),
				u = "tags" === f.dynamicOperands || "tiddlers" === f.dynamicOperands;
			if(m.push(...o.filter(e => !d.has(e) && (d.add(e), !0)).map(e => ({
					label: e,
					type: "fields" === f.dynamicOperands ? "variable" : "functions" === f.dynamicOperands ? "function" : "text",
					detail: c,
					...u ? {
						boost: In(e)
					} : {}
				}))), l.length > 0)
				if("variables" === f.dynamicOperands) {
					m.push(...s.builtIns.filter(e => !d.has(e) && (d.add(e), !0)).map(e => ({
						label: e,
						type: "keyword",
						detail: `${c} (built-in)`
					})));
					const e = [...s.functions, ...s.procedures, ...s.macros, ...s.widgets, ...s.widgetVars];
					m.push(...e.filter(e => !d.has(e) && (d.add(e), !0)).map(e => ({
						label: e,
						type: "function",
						detail: `${c} (local)`
					})))
				} else m.push(...l.filter(e => !d.has(e) && (d.add(e), !0)).map(e => ({
					label: e,
					type: "function",
					detail: `${c} (local)`
				})))
		}
		if(0 === m.length) return null;
		const g = p.length > 0 ? m.filter(e => e.label.toLowerCase().startsWith(p.toLowerCase())) : m;
		return 0 === g.length ? null : {
			from: o - p.length,
			to: o,
			options: g,
			validFor: /^[^\]]*$/
		}
	}
}
const dr = [{
	label: "if",
	detail: "Conditional if",
	insert: " if [] %>",
	outdent: !1
}, {
	label: "elseif",
	detail: "Conditional else-if",
	insert: " elseif [] %>",
	outdent: !0
}, {
	label: "else",
	detail: "Conditional else",
	insert: " else %>",
	outdent: !0
}, {
	label: "endif",
	detail: "End conditional",
	insert: " endif %>",
	outdent: !0
}];

function ur(e) {
	const t = e.pos,
		n = e.state.doc,
		r = n.lineAt(t),
		i = n.sliceString(r.from, t),
		s = /<%(\s*)(\w*)$/.exec(i);
	if(!s) return null;
	const o = s[1],
		l = s[2],
		c = o.length > 0,
		d = t - l.length,
		u = l.length,
		f = i.lastIndexOf("<%"),
		p = dr.map(e => {
			const t = c ? e.insert.trimStart() : e.insert;
			return {
				label: e.label,
				type: "keyword",
				detail: e.detail,
				apply: (n, s, o, l) => {
					if(e.outdent && f > 0 && 1 === n.state.selection.ranges.length) {
						const t = a.getIndentUnit(n.state),
							s = i.slice(0, f);
						let o = 0;
						for(const e of s) " " === e ? o++ : "\t" === e && (o += t);
						const c = Math.max(0, o - t),
							d = " ".repeat(c) + "<%" + e.insert,
							u = "elseif" === e.label ? d.indexOf("[") + 1 : d.length;
						n.dispatch({
							changes: {
								from: r.from,
								to: l,
								insert: d
							},
							selection: {
								anchor: r.from + u
							}
						})
					} else {
						const r = "if" === e.label || "elseif" === e.label ? t.indexOf("[") + 1 : t.length,
							i = Ln(n, o, l, t, u);
						n.dispatch({
							changes: i,
							selection: {
								anchor: o + r
							}
						})
					}
				}
			}
		});
	return {
		from: d,
		to: t,
		options: p,
		validFor: /^\w*$/
	}
}
const fr = [{
	label: "define",
	detail: "Define a macro",
	insert: "define name()\n\n\\end",
	selectFrom: 7,
	selectTo: 11
}, {
	label: "procedure",
	detail: "Define a procedure",
	insert: "procedure name()\n\n\\end",
	selectFrom: 10,
	selectTo: 14
}, {
	label: "function",
	detail: "Define a function",
	insert: "function name()\n\n\\end",
	selectFrom: 9,
	selectTo: 13
}, {
	label: "widget",
	detail: "Define a widget",
	insert: "widget $name()\n\n\\end",
	selectFrom: 7,
	selectTo: 12
}, {
	label: "import",
	detail: "Import tiddlers",
	insert: "import [filter]",
	selectFrom: 8,
	selectTo: 14
}, {
	label: "rules",
	detail: "Set parser rules",
	insert: "rules only ",
	cursorOffset: 11
}, {
	label: "parameters",
	detail: "Declare parameters",
	insert: "parameters()",
	cursorOffset: 11
}, {
	label: "whitespace",
	detail: "Whitespace handling",
	insert: "whitespace trim",
	cursorOffset: 15
}, {
	label: "end",
	detail: "End a definition",
	insert: "end",
	cursorOffset: 3
}];

function pr(e) {
	const t = e.pos,
		n = e.state.doc,
		r = n.lineAt(t),
		i = n.sliceString(r.from, t),
		s = /^(\s*)\\(\w*)$/.exec(i);
	if(!s) return null;
	const a = s[1],
		o = r.from + a.length + 1,
		l = fr.map(e => ({
			label: e.label,
			type: "keyword",
			detail: e.detail,
			apply: (t, n, r, i) => {
				let s, o = e.insert;
				if(o.includes("\\end") && a && (o = o.replace(/\n\\end/, "\n" + a + "\\end")), void 0 !== e.selectFrom && void 0 !== e.selectTo) s = {
					anchor: r + e.selectFrom,
					head: r + e.selectTo
				};
				else {
					s = {
						anchor: r + (e.cursorOffset ?? o.length)
					}
				}
				t.dispatch({
					changes: {
						from: r,
						to: i,
						insert: o
					},
					selection: s
				})
			}
		}));
	return {
		from: o,
		to: t,
		options: l,
		validFor: /^\w*$/
	}
}

function hr(e) {
	const t = e.pos,
		n = e.state.doc,
		r = n.lineAt(t),
		i = n.sliceString(r.from, t),
		s = /^(\s*)\\end\s+(\S*)$/.exec(i);
	if(!s) return null;
	const o = r.from + i.length - s[2].length,
		l = a.syntaxTree(e.state),
		c = [];
	if(l.iterate({
			enter: e => {
				const r = e.name;
				if(("MacroDefinition" === r || "ProcedureDefinition" === r || "FunctionDefinition" === r || "WidgetDefinition" === r) && e.from <= t && e.to >= t) {
					let t = null;
					const i = e.node.cursor();
					i.firstChild();
					do {
						if("PragmaName" === i.name) {
							t = n.sliceString(i.from, i.to);
							break
						}
					} while(i.nextSibling());
					t && c.push({
						name: t,
						type: r.replace("Definition", "")
					})
				}
			}
		}), 0 === c.length) return null;
	const d = c.reverse().map((e, t) => ({
		label: e.name,
		type: "variable",
		detail: `Close ${e.type.toLowerCase()}`,
		boost: c.length - t
	}));
	return {
		from: o,
		to: t,
		options: d,
		validFor: /^\S*$/
	}
}
const mr = Rt,
	gr = Rt;
let kr = null,
	xr = null;
const br = ["", "text/vnd.tiddlywiki", "text/x-tiddlywiki", "application/x-tiddler-dictionary"],
	yr = "tiddlywikiLanguage",
	wr = n.Prec.high(r.keymap.of([{
		key: "Enter",
		run: jt
	}, {
		key: "Backspace",
		run: Ut
	}, {
		key: "Mod-b",
		run: Jt
	}, {
		key: "Mod-i",
		run: Xt
	}, {
		key: "Mod-u",
		run: Yt
	}, {
		key: "Mod-`",
		run: rn
	}, {
		key: "Mod-k",
		run: sn
	}, {
		key: "Mod-Shift-k",
		run: an
	}, {
		key: "Mod-1",
		run: ln
	}, {
		key: "Mod-2",
		run: cn
	}, {
		key: "Mod-3",
		run: dn
	}, {
		key: "Mod-4",
		run: un
	}, {
		key: "Mod-5",
		run: fn
	}, {
		key: "Mod-6",
		run: pn
	}, {
		key: "Mod-0",
		run: hn
	}, {
		key: "Mod-Shift-8",
		run: gn
	}, {
		key: "Mod-Shift-7",
		run: kn
	}, {
		key: "Mod-Shift-c",
		run: xn
	}]));

function $r(e) {
	return {
		state: e.state,
		dispatch: e.dispatch.bind(e)
	}
}

function Tr() {
	if("undefined" == typeof $tw) return [];
	try {
		const e = xr?.widget?.wiki || $tw.wiki;
		if(!e) return [];
		const t = [];
		if(e.eachShadowPlusTiddlers) e.eachShadowPlusTiddlers((e, n) => {
			t.push(n)
		});
		else {
			const n = e.allTitles ? e.allTitles() : [],
				r = e.allShadowTitles ? e.allShadowTitles() : [];
			t.push(...n, ...r)
		}
		return [...new Set(t)].sort((e, t) => {
			const n = e.startsWith("$:/");
			return n !== t.startsWith("$:/") ? n ? 1 : -1 : e.localeCompare(t)
		})
	} catch (e) {
		return []
	}
}

function Mr() {
	if("undefined" == typeof $tw) return [];
	try {
		const e = xr?.widget?.wiki || $tw.wiki;
		if(!e) return [];
		const t = xr?.widget;
		return (t ? e.filterTiddlers("[all[tiddlers+shadows]is[image]]", t) : e.filterTiddlers("[all[tiddlers+shadows]is[image]]")) || []
	} catch (e) {
		return []
	}
}

function Sr() {
	if("undefined" == typeof $tw) return [];
	try {
		const e = [];
		$tw.macros && e.push(...Object.keys($tw.macros));
		const t = xr?.widget?.wiki || $tw.wiki;
		if(t) {
			const n = t.filterTiddlers("[all[tiddlers+shadows]tag[$:/tags/Macro]] [all[tiddlers+shadows]tag[$:/tags/Global]]") || [];
			for(const r of n) {
				const n = t.getTiddler(r);
				if(n) {
					const t = (n.fields.text || "").matchAll(/\\(?:define|procedure|function)\s+([^\s(]+)/g);
					for(const n of t) e.push(n[1])
				}
			}
		}
		return [...new Set(e)]
	} catch (e) {
		return []
	}
}

function Cr() {
	if("undefined" == typeof $tw) return [];
	try {
		const e = [];
		if($tw.widgets)
			for(const t of Object.keys($tw.widgets)) e.push("$" + t);
		return e
	} catch (e) {
		return []
	}
}

function Lr() {
	if("undefined" == typeof $tw) return [];
	try {
		const e = xr?.widget?.wiki || $tw.wiki;
		return e?.filterOperators ? Object.keys(e.filterOperators).sort() : []
	} catch (e) {
		return []
	}
}

function vr() {
	if("undefined" == typeof $tw) return [];
	try {
		const e = xr?.widget?.wiki || $tw.wiki;
		if(!e) return [];
		const t = xr?.widget;
		return (t ? e.filterTiddlers("[all[tiddlers+shadows]is[tag]]", t) : e.filterTiddlers("[all[tiddlers+shadows]is[tag]]")) || []
	} catch (e) {
		return []
	}
}

function Pr(e) {
	if("undefined" == typeof $tw || !e) return [];
	try {
		const t = xr?.widget?.wiki || $tw.wiki;
		if(!t) return [];
		const n = t.getTiddler(e);
		return n && n.fields ? Object.keys(n.fields).sort() : []
	} catch (e) {
		return []
	}
}

function Er(e) {
	if("undefined" == typeof $tw || !e) return [];
	try {
		const t = xr?.widget?.wiki || $tw.wiki;
		if(!t) return [];
		const n = t.getTiddlerDataCached(e);
		return n && "object" == typeof n ? Object.keys(n).sort() : []
	} catch (e) {
		return []
	}
}

function Br(e) {
	if("undefined" == typeof $tw) return null;
	try {
		if($tw.macros && $tw.macros[e] && $tw.macros[e].params) {
			const t = $tw.macros[e].params;
			if(Array.isArray(t)) return t.map(e => e.name)
		}
		const t = xr?.widget;
		if(t?.getVariableInfo) {
			const n = t.getVariableInfo(e);
			if(n && n.params && Array.isArray(n.params)) return n.params.map(e => e.name)
		}
		return null
	} catch (e) {
		return null
	}
}

function Ar() {
	const e = xr;
	return e?.options?.codeLanguages ? e.options.codeLanguages : []
}

function Ir(e) {
	const t = e.options || {};
	return xr = e.engine, An({
		addKeymap: !1,
		codeLanguages: Ar(),
		completeHTMLTags: !1 !== t.completeHTMLTags,
		completeWidgets: !1 !== t.completeWidgets,
		completeMacros: !1 !== t.completeMacros,
		completeTiddlers: !1 !== t.completeTiddlers,
		completeFilterOperators: !1 !== t.completeFilterOperators,
		completeFilterRunPrefixes: !1 !== t.completeFilterRunPrefixes,
		getTiddlerTitles: Tr,
		getImageTiddlerTitles: Mr,
		getMacroNames: Sr,
		getMacroParams: Br,
		getWidgetNames: Cr,
		getFilterOperators: Lr,
		getTagNames: vr,
		getTiddlerFields: Pr,
		getTiddlerIndexes: Er
	})
}
const Fr = {
	name: "tiddlywiki-syntax",
	description: "TiddlyWiki5 Wikitext syntax highlighting and editing support",
	priority: 100,
	init(e) {
		kr = e
	},
	condition(e) {
		const t = e.tiddlerType;
		return br.includes(t || "")
	},
	registerCompartments() {
		if(!kr) return {};
		const e = kr.state.Compartment;
		return {
			[yr]: new e
		}
	},
	getExtensions(e) {
		const t = [],
			n = e.engine,
			r = n?._compartments,
			i = Ir(e);
		if(r?.[yr] ? t.push(r[yr].of(i)) : t.push(i), t.push(Ht), !e.readOnly) {
			const n = e.engine?.widget?.wiki || ("undefined" != typeof $tw ? $tw.wiki : null);
			"default" === (n?.getTiddlerText?.("$:/config/codemirror-6/keymap", "default") ?? "default") && t.push(wr)
		}
		return t
	},
	getCompartmentContent: e => [Ir(e), Ht],
	extendAPI: (e, t) => ({
		toggleBold: () => !(e._destroyed || !e.view) && Jt($r(e.view)),
		toggleItalic: () => !(e._destroyed || !e.view) && Xt($r(e.view)),
		toggleUnderline: () => !(e._destroyed || !e.view) && Yt($r(e.view)),
		toggleStrikethrough: () => !(e._destroyed || !e.view) && en($r(e.view)),
		toggleSuperscript: () => !(e._destroyed || !e.view) && tn($r(e.view)),
		toggleSubscript: () => !(e._destroyed || !e.view) && nn($r(e.view)),
		toggleInlineCode: () => !(e._destroyed || !e.view) && rn($r(e.view)),
		insertWikiLink: () => !(e._destroyed || !e.view) && sn($r(e.view)),
		insertTransclusion: () => !(e._destroyed || !e.view) && an($r(e.view)),
		setHeading(t) {
			if(e._destroyed || !e.view) return !1;
			const n = [null, ln, cn, dn, un, fn, pn][t];
			return !!n && n($r(e.view))
		},
		removeHeading: () => !(e._destroyed || !e.view) && hn($r(e.view)),
		toggleBulletList: () => !(e._destroyed || !e.view) && gn($r(e.view)),
		toggleNumberedList: () => !(e._destroyed || !e.view) && kn($r(e.view)),
		insertCodeBlock: () => !(e._destroyed || !e.view) && xn($r(e.view))
	}),
	registerEvents: (e, t) => ({
		textOperation(t) {
			if(t && !e._destroyed && (null === t.replacement || void 0 === t.replacement)) switch(t.type) {
				case "toggle-bold":
					e.toggleBold?.();
					break;
				case "toggle-italic":
					e.toggleItalic?.();
					break;
				case "toggle-underline":
					e.toggleUnderline?.();
					break;
				case "toggle-strikethrough":
					e.toggleStrikethrough?.();
					break;
				case "toggle-superscript":
					e.toggleSuperscript?.();
					break;
				case "toggle-subscript":
					e.toggleSubscript?.();
					break;
				case "toggle-code":
					e.toggleInlineCode?.();
					break;
				case "insert-link":
					e.insertWikiLink?.();
					break;
				case "insert-transclusion":
					e.insertTransclusion?.();
					break;
				case "set-heading":
					"number" == typeof t.level && e.setHeading?.(t.level);
					break;
				case "remove-heading":
					e.removeHeading?.();
					break;
				case "toggle-bullet-list":
					e.toggleBulletList?.();
					break;
				case "toggle-numbered-list":
					e.toggleNumberedList?.();
					break;
				case "insert-code-block":
					e.insertCodeBlock?.()
			}
		}
	}),
	destroy(e) {}
};
exports.TiddlyWikiLanguage = gr, exports.default = Fr, exports.deleteBracketPair = qt, exports.deleteMarkupBackward = Ut, exports.indentList = wn, exports.insertCodeBlock = xn, exports.insertHorizontalRule = ({
	state: e,
	dispatch: t
}) => {
	let n = e.doc.lineAt(e.selection.main.from);
	return t(e.update({
		changes: {
			from: n.to,
			insert: "\n---\n"
		},
		scrollIntoView: !0,
		userEvent: "input"
	})), !0
}, exports.insertMacroCall = ({
	state: e,
	dispatch: t
}) => {
	let r = e.changeByRange(t => {
		if(t.empty) return {
			range: n.EditorSelection.cursor(t.from + 2),
			changes: {
				from: t.from,
				insert: "<<>>"
			}
		};
		{
			let r = e.doc.sliceString(t.from, t.to);
			return {
				range: n.EditorSelection.range(t.from + 2, t.from + 2 + r.length),
				changes: {
					from: t.from,
					to: t.to,
					insert: `<<${r}>>`
				}
			}
		}
	});
	return t(e.update(r, {
		scrollIntoView: !0,
		userEvent: "input"
	})), !0
}, exports.insertNewlineContinueMarkup = jt, exports.insertNewlineContinueMarkupCommand = Zt, exports.insertTransclusion = an, exports.insertWikiLink = sn, exports.listMarkerDowngrade = yn, exports.listMarkerUpgradeHandler = bn, exports.outdentList = $n, exports.plugin = Fr, exports.removeHeading = hn, exports.setHeading1 = ln, exports.setHeading2 = cn, exports.setHeading3 = dn, exports.setHeading4 = un, exports.setHeading5 = fn, exports.setHeading6 = pn, exports.tiddlywiki = An, exports.tiddlywikiBaseLanguage = mr, exports.tiddlywikiLanguage = Rt, exports.toggleBold = Jt, exports.toggleBulletList = gn, exports.toggleInlineCode = rn, exports.toggleItalic = Xt, exports.toggleNumberedList = kn, exports.toggleStrikethrough = en, exports.toggleSubscript = nn, exports.toggleSuperscript = tn, exports.toggleUnderline = Yt;
