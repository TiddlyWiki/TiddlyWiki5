/*\
title: $:/plugins/tiddlywiki/prosemirror/patch/startup.js
type: application/javascript
module-type: startup

Temporary monkey-patches for core modules required by the ProseMirror plugin.
These patches shadow changes from the feat/prosemirror-wysiwyg-editor branch so
the plugin can function without modifying core files.

Remove this directory entirely when the core patches are merged upstream.

\*/

"use strict";

exports.name = "prosemirror-patch";
exports.after = ["load-modules"];
exports.synchronous = true;

exports.startup = function() {
	if(!$tw.browser) return;
	try {
		patchEditWidget();
		patchEditTextWidget();
		patchWikiParserPreserveBlankLines();
	} catch(e) {
		console.error("[ProseMirror Patch] Error applying core patches:", e);
	}
};

// ---------------------------------------------------------------------------
// Patch 1: $:/core/modules/widgets/edit.js
//   - Add hasParserForType() fallback for prosemirror editor type
//   - Set tv-editor-type variable
// ---------------------------------------------------------------------------
function patchEditWidget() {
	var WidgetClass = $tw.rootWidget.constructor;
	var EditWidget = WidgetClass.prototype.widgetClasses.edit;
	if(!EditWidget) {
		console.warn("[ProseMirror Patch] EditWidget not found, skipping patch");
		return;
	}

	// Wrap execute() to set tv-editor-type
	var origExecute = EditWidget.prototype.execute;
	EditWidget.prototype.execute = function() {
		origExecute.call(this);
		this.setVariable("tv-editor-type",this.editorType);
	};

	// Replace getEditorType() to add prosemirror fallback check
	EditWidget.prototype.getEditorType = function() {
		var type;
		if(this.editField === "text") {
			var tiddler = this.wiki.getTiddler(this.editTitle);
			if(tiddler) {
				type = tiddler.fields.type;
			}
		}
		type = type || "text/vnd.tiddlywiki";
		var editorType = this.wiki.getTiddlerText("$:/config/EditorTypeMappings/" + type);
		if(editorType) {
			editorType = editorType.trim();
		}
		if(editorType === "prosemirror" && (!$tw.browser || !hasParserForType(type))) {
			editorType = "text";
		}
		if(!editorType) {
			var typeInfo = $tw.config.contentTypeInfo[type];
			if(typeInfo && typeInfo.encoding === "base64") {
				editorType = "binary";
			} else {
				editorType = "text";
			}
		}
		return editorType;
	};
}

function hasParserForType(type) {
	var parser = $tw.Wiki.parsers[type],
		fileExtensionInfo;
	if(!parser) {
		fileExtensionInfo = $tw.utils.getFileExtensionInfo(type);
		if(fileExtensionInfo) {
			parser = $tw.Wiki.parsers[fileExtensionInfo.type];
		}
	}
	return !!parser;
}

// ---------------------------------------------------------------------------
// Patch 2: $:/core/modules/editor/factory.js  —  handleTextOperationNatively hook
//   Without this, toolbar ops (bold, link, etc.) fall through to
//   createTextOperation()/updateDomNodeText() which destroys undo history.
// ---------------------------------------------------------------------------
function patchEditTextWidget() {
	var WidgetClass = $tw.rootWidget.constructor;
	var EditProsemirrorWidget = WidgetClass.prototype.widgetClasses["edit-prosemirror"];
	if(!EditProsemirrorWidget) {
		console.warn("[ProseMirror Patch] edit-prosemirror widget not found, skipping patch");
		return;
	}

	var origHandler = EditProsemirrorWidget.prototype.handleEditTextOperationMessage;
	EditProsemirrorWidget.prototype.handleEditTextOperationMessage = function(event) {
		if(this.engine.handleTextOperationNatively && this.engine.handleTextOperationNatively(event)) {
			this.engine.fixHeight();
			this.saveChanges(this.engine.getText());
			return;
		}
		return origHandler.call(this,event);
	};
}

// ---------------------------------------------------------------------------
// Patch 3: $:/core/modules/parsers/wikiparser/wikiparser.js
//   + $:/core/modules/wiki.js
//   — preserveBlankLines support for round-trip fidelity (empty paragraphs)
// ---------------------------------------------------------------------------
function patchWikiParserPreserveBlankLines() {
	var OrigWikiParser = $tw.Wiki.parsers["text/vnd.tiddlywiki"];
	if(!OrigWikiParser) return;

	// ----- new prototype methods -----

	OrigWikiParser.prototype.makeBlankLineBlocks = function(start,whitespace,options) {
		options = options || {};
		var newlineMatches = whitespace.match(/\r?\n/g),
			newlineCount = newlineMatches ? newlineMatches.length : 0,
			blankLineCount = options.leading ? Math.max(0,newlineCount - 1) : Math.max(0,newlineCount - 2),
			blankLineBlocks = [];
		for(var index = 0; index < blankLineCount; index++) {
			blankLineBlocks.push({
				type: "element",
				tag: "p",
				attributes: {
					class: {name: "class", type: "string", value: "tc-blankline"}
				},
				orderedAttributes: [
					{name: "class", type: "string", value: "tc-blankline"}
				],
				children: [],
				start: start,
				end: start,
				rule: "blankline",
				isLeadingBlankLine: !!options.leading && index === 0
			});
		}
		return blankLineBlocks;
	};

	OrigWikiParser.prototype.parseBlankLineBlocks = function(options) {
		var whitespaceRegExp = /(\s+)/mg;
		whitespaceRegExp.lastIndex = this.pos;
		var whitespaceMatch = whitespaceRegExp.exec(this.source);
		if(whitespaceMatch && whitespaceMatch.index === this.pos) {
			var start = this.pos,
				whitespace = whitespaceMatch[0];
			this.pos = whitespaceRegExp.lastIndex;
			return this.makeBlankLineBlocks(start,whitespace,options);
		}
		return [];
	};

	OrigWikiParser.prototype.getTrailingBlankLineBlocks = function(blocks) {
		if(blocks.length === 0) {
			return [];
		}
		var lastBlock = blocks[blocks.length - 1];
		if(lastBlock.end === undefined || lastBlock.end >= this.pos) {
			return [];
		}
		var whitespace = this.source.substring(lastBlock.end,this.pos);
		return /^\s+$/.test(whitespace) ? this.makeBlankLineBlocks(lastBlock.end,whitespace) : [];
	};

	// ----- override parseBlocksUnterminated -----
	var origParseBlocksUnterminated = OrigWikiParser.prototype.parseBlocksUnterminated;
	OrigWikiParser.prototype.parseBlocksUnterminated = function() {
		if(!this.preserveBlankLines) {
			return origParseBlocksUnterminated.call(this);
		}
		var tree = [];
		var isLeading = true;
		while(this.pos < this.sourceLength) {
			tree.push.apply(tree,this.parseBlankLineBlocks({leading: isLeading}));
			if(this.pos >= this.sourceLength) {
				break;
			}
			var blocks = this.parseBlock();
			tree.push.apply(tree,blocks);
			tree.push.apply(tree,this.getTrailingBlankLineBlocks(blocks));
			tree.push.apply(tree,this.parseBlankLineBlocks());
			isLeading = false;
		}
		return tree;
	};

	// ----- override parseBlocksTerminatedExtended -----
	var origParseBlocksTerminatedExtended = OrigWikiParser.prototype.parseBlocksTerminatedExtended;
	OrigWikiParser.prototype.parseBlocksTerminatedExtended = function(terminatorRegExpString) {
		if(!this.preserveBlankLines) {
			return origParseBlocksTerminatedExtended.call(this,terminatorRegExpString);
		}
		var terminatorRegExp = /(\r?\n\r?\n)$/mg,
			result = {
				terminatorMatch: [],
				tree: []
			};
		// Skip whitespace / leading blank lines
		result.tree.push.apply(result.tree,this.parseBlankLineBlocks({leading: true}));
		// Check if we've got the end marker
		terminatorRegExp.lastIndex = this.pos;
		var match = terminatorRegExp.exec(this.source);
		while(this.pos < this.sourceLength && !(match && match.index === this.pos)) {
			var blocks = this.parseBlock(terminatorRegExpString);
			result.tree.push.apply(result.tree,blocks);
			result.tree.push.apply(result.tree,this.getTrailingBlankLineBlocks(blocks));
			// Blank lines between blocks
			result.tree.push.apply(result.tree,this.parseBlankLineBlocks());
			// Check if we've got the end marker
			terminatorRegExp.lastIndex = this.pos;
			match = terminatorRegExp.exec(this.source);
		}
		if(match && match.index === this.pos) {
			result.terminatorMatch = match;
			this.pos = terminatorRegExp.lastIndex;
		}
		return result;
	};

	// ----- Wrap constructor to set preserveBlankLines on every instance -----
	var PatchedWikiParser = function(type,text,options) {
		options = options || {};
		var parser = new OrigWikiParser(type,text,options);
		parser.preserveBlankLines = options.preserveBlankLines === true ||
			(options.preserveBlankLines !== false && $tw.wiki && $tw.wiki.getTiddlerText("$:/config/Parser/PreserveBlankLines","no") === "yes");
		return parser;
	};
	PatchedWikiParser.prototype = OrigWikiParser.prototype;
	$tw.Wiki.parsers["text/vnd.tiddlywiki"] = PatchedWikiParser;
}
