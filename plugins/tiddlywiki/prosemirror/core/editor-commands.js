/*\
title: $:/plugins/tiddlywiki/prosemirror/core/editor-commands.js
type: application/javascript
module-type: library

Executes semantic editor commands as ProseMirror transactions. Command menu
descriptors remain editor-independent and never receive an EditorView.

\*/

"use strict";

const pmCommands = require("prosemirror-commands");
const flatListCommands = require("prosemirror-flat-list");
const { TextSelection } = require("prosemirror-state");
const { Slice } = require("prosemirror-model");
const { parseWidget } = require("$:/plugins/tiddlywiki/prosemirror/blocks/widget/utils.js");
const { scheduleEnterWidgetBlockEditModeNearSelection } = require("$:/plugins/tiddlywiki/prosemirror/blocks/widget/actions.js");
const dragHelpers = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js");
const { stripSourceMetadata } = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js");
const { serializeProseMirrorNodes } = require("$:/plugins/tiddlywiki/prosemirror/ast/serialize-wikitext.js");

function getView(context) {
	return context && context.view;
}

function getParameters(command) {
	return command && command.parameters || Object.create(null);
}

function getCurrentBlock(context) {
	const view = getView(context);
	if(!view || !context || typeof context.blockPos !== "number" || !context.blockNode) {
		return null;
	}
	return dragHelpers.resolveCurrentBlock(view, context.blockPos, context.blockNode);
}

function canInsertNode(state, nodeType) {
	const $from = state.selection.$from;
	for(let depth = $from.depth; depth >= 0; depth--) {
		const index = $from.index(depth);
		if($from.node(depth).canReplaceWith(index, index, nodeType)) {
			return true;
		}
	}
	return false;
}

function runPmCommand(context, command, dispatch) {
	const view = getView(context);
	if(!view || typeof command !== "function") {
		return false;
	}
	return !!command(view.state, dispatch ? view.dispatch.bind(view) : undefined, view);
}

function runSetBlockType(context, type, attrs, dispatch) {
	const view = getView(context);
	if(!view || !type) {
		return false;
	}
	const block = getCurrentBlock(context);
	if(block && block.node.isTextblock) {
		if(!block.node.type.isInGroup("block")) {
			return false;
		}
		const requestedAttrs = attrs || {};
		const alreadyRequestedType = block.node.type === type && Object.keys(requestedAttrs).every(function(name) {
			return block.node.attrs[name] === requestedAttrs[name];
		});
		if(alreadyRequestedType) {
			return false;
		}
		if(!dispatch) {
			return true;
		}
		const tr = view.state.tr.setBlockType(block.pos, block.pos + block.node.nodeSize, type, attrs);
		if(!tr.docChanged) {
			return false;
		}
		view.dispatch(tr.scrollIntoView());
		return true;
	}
	return runPmCommand(context, pmCommands.setBlockType(type, attrs), dispatch);
}

function toggleMark(context, command, dispatch) {
	const view = getView(context);
	const markName = getParameters(command).mark;
	const mark = view && view.state.schema.marks[markName];
	return mark ? runPmCommand(context, pmCommands.toggleMark(mark), dispatch) : false;
}

function setParagraph(context, command, dispatch) {
	const view = getView(context);
	const paragraph = view && view.state.schema.nodes.paragraph;
	return paragraph ? runSetBlockType(context, paragraph, null, dispatch) : false;
}

function toggleHeading(context, command, dispatch) {
	const view = getView(context);
	if(!view) {
		return false;
	}
	const level = parseInt(getParameters(command).level, 10);
	const heading = view.state.schema.nodes.heading;
	const paragraph = view.state.schema.nodes.paragraph;
	if(!heading || !paragraph || level < 1 || level > 6) {
		return false;
	}
	const block = getCurrentBlock(context);
	const current = block ? block.node : view.state.selection.$from.parent;
	if(current.type === heading && current.attrs.level === level) {
		return runSetBlockType(context, paragraph, null, dispatch);
	}
	return runSetBlockType(context, heading, { level: level }, dispatch);
}

function toggleCodeBlock(context, command, dispatch) {
	const view = getView(context);
	if(!view) {
		return false;
	}
	const codeBlock = view.state.schema.nodes.code_block;
	const paragraph = view.state.schema.nodes.paragraph;
	if(!codeBlock || !paragraph) {
		return false;
	}
	const block = getCurrentBlock(context);
	const current = block ? block.node : view.state.selection.$from.parent;
	return runSetBlockType(context, current.type === codeBlock ? paragraph : codeBlock, null, dispatch);
}

function toggleBlockquote(context, command, dispatch) {
	const view = getView(context);
	if(!view || !view.state.schema.nodes.blockquote) {
		return false;
	}
	const block = getCurrentBlock(context);
	if(block && block.node.type === view.state.schema.nodes.blockquote) {
		const $pos = view.state.doc.resolve(block.pos);
		const index = $pos.index();
		if(!$pos.parent.canReplace(index, index + 1, block.node.content)) {
			return false;
		}
		if(dispatch) {
			view.dispatch(view.state.tr.replaceWith(
				block.pos,
				block.pos + block.node.nodeSize,
				block.node.content
			).scrollIntoView());
		}
		return true;
	}
	const $from = view.state.selection.$from;
	for(let depth = $from.depth; depth > 0; depth--) {
		if($from.node(depth).type === view.state.schema.nodes.blockquote) {
			return runPmCommand(context, pmCommands.lift, dispatch);
		}
	}
	return runPmCommand(context, pmCommands.wrapIn(view.state.schema.nodes.blockquote), dispatch);
}

function toggleList(context, command, dispatch) {
	const view = getView(context);
	if(!view || !view.state.schema.nodes.list) {
		return false;
	}
	const kind = getParameters(command).kind;
	if(["bullet", "ordered", "task"].indexOf(kind) === -1) {
		return false;
	}
	const block = getCurrentBlock(context);
	if(block && block.node.type === view.state.schema.nodes.list && block.node.attrs.kind !== kind) {
		if(!dispatch) {
			return true;
		}
		const attrs = Object.assign({}, block.node.attrs, { kind: kind });
		if(kind === "task" && attrs.checked == null) {
			attrs.checked = false;
		}
		view.dispatch(view.state.tr.setNodeMarkup(block.pos, null, attrs).scrollIntoView());
		return true;
	}
	return runPmCommand(context, flatListCommands.createToggleListCommand({ kind: kind }), dispatch);
}

function insertHorizontalRule(context, command, dispatch) {
	const view = getView(context);
	const type = view && view.state.schema.nodes.horizontal_rule;
	if(!type || !canInsertNode(view.state, type)) {
		return false;
	}
	if(dispatch) {
		view.dispatch(view.state.tr.replaceSelectionWith(type.create()).scrollIntoView());
	}
	return true;
}

function createTable(schema, parameters) {
	if(!schema.nodes.table || !schema.nodes.table_row || !schema.nodes.table_cell || !schema.nodes.table_header) {
		return null;
	}
	const rowCount = Math.max(1, Math.min(20, parseInt(parameters.rows, 10) || 3));
	const columnCount = Math.max(1, Math.min(20, parseInt(parameters.columns, 10) || 3));
	const hasHeader = parameters.header !== "no";
	const rows = [];
	for(let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
		const cells = [];
		const cellType = hasHeader && rowIndex === 0 ? schema.nodes.table_header : schema.nodes.table_cell;
		for(let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
			cells.push(cellType.createAndFill());
		}
		rows.push(schema.nodes.table_row.create(null, cells));
	}
	return schema.nodes.table.create(null, rows);
}

function insertTable(context, command, dispatch) {
	const view = getView(context);
	if(!view) {
		return false;
	}
	const table = createTable(view.state.schema, getParameters(command));
	if(!table || !canInsertNode(view.state, table.type)) {
		return false;
	}
	if(dispatch) {
		view.dispatch(view.state.tr.replaceSelectionWith(table).scrollIntoView());
		view.focus();
	}
	return true;
}

function insertHardLineBreaks(context, command, dispatch) {
	const view = getView(context);
	const type = view && view.state.schema.nodes.hard_line_breaks_block;
	const node = type && type.createAndFill();
	if(!node || !canInsertNode(view.state, type)) {
		return false;
	}
	if(dispatch) {
		view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
		view.focus();
	}
	return true;
}

function insertTypedBlock(context, command, dispatch) {
	const view = getView(context);
	const type = view && view.state.schema.nodes.typed_block;
	const parseType = getParameters(command).type || "text/plain";
	if(!type || !canInsertNode(view.state, type)) {
		return false;
	}
	if(dispatch) {
		const node = type.create({ rawText: "", parseType: parseType, renderType: null, autoEdit: true });
		view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
		view.focus();
	}
	return true;
}

function replaceSelectionWithWikiText(context, source, parameters) {
	const view = getView(context);
	const wiki = context && context.wiki;
	if(!view || !wiki || typeof source !== "string") {
		return false;
	}
	const parseWikiTextToDoc = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js").parseWikiTextToDoc;
	const parsedJSON = stripSourceMetadata(parseWikiTextToDoc(wiki, "text/vnd.tiddlywiki", source));
	const parsedDoc = view.state.schema.nodeFromJSON(parsedJSON);
	let tr = view.state.tr;
	parameters = parameters || {};
	if(typeof parameters.from === "number" && typeof parameters.to === "number" &&
		parameters.from >= 0 && parameters.from <= parameters.to && parameters.to <= tr.doc.content.size) {
		tr = tr.setSelection(TextSelection.create(tr.doc, parameters.from, parameters.to));
	}
	const onlyChild = parsedDoc.childCount === 1 ? parsedDoc.firstChild : null;
	const widget = parseWidget(source.trim());
	const inlineContext = tr.selection.$from.parent.isTextblock && tr.selection.$from.parent.content.size > 0;
	let insertedInlineSource = false;
	if(inlineContext && onlyChild && (onlyChild.type === view.state.schema.nodes.opaque_block || widget)) {
		const inlineNode = createInlineSourceNode(view.state, source);
		if(!inlineNode) {
			return false;
		}
		tr = tr.replaceSelectionWith(inlineNode, false);
		insertedInlineSource = true;
	} else if(onlyChild && onlyChild.type === view.state.schema.nodes.paragraph && tr.selection.$from.parent.isTextblock) {
		tr = tr.replaceSelection(new Slice(onlyChild.content, 0, 0));
	} else {
		tr = tr.replaceSelection(new Slice(parsedDoc.content, 0, 0));
	}
	view.dispatch(tr.scrollIntoView());
	view.focus();
	if(widget && !insertedInlineSource) {
		scheduleEnterWidgetBlockEditModeNearSelection(view, { expectedWidgetName: widget.widgetName });
	}
	return true;
}

function insertWikiText(context, command, dispatch) {
	const parameters = getParameters(command);
	const source = parameters.text;
	if(!getView(context) || !context.wiki || typeof source !== "string") {
		return false;
	}
	return dispatch ? replaceSelectionWithWikiText(context, source, parameters) : true;
}

function createInlineSourceNode(state, rawText) {
	const type = state.schema.nodes.opaque_inline;
	if(!type || typeof rawText !== "string" || rawText.length === 0) {
		return null;
	}
	return type.create({
		rawText: rawText,
		firstLine: rawText.split("\n")[0] || rawText,
		parseTreeJson: null
	});
}

function createBlockSourceNode(state, rawText) {
	const type = state.schema.nodes.opaque_block;
	if(!type || typeof rawText !== "string" || rawText.length === 0) {
		return null;
	}
	return type.create({
		rawText: rawText,
		firstLine: rawText.split("\n")[0] || rawText,
		parseTreeJson: null,
		autoEdit: false
	});
}

function replaceRangeWithInlineSource(view, from, to, rawText, dispatch) {
	const node = view && createInlineSourceNode(view.state, rawText);
	if(!node || typeof from !== "number" || typeof to !== "number" || from >= to) {
		return false;
	}
	const $from = view.state.doc.resolve(from);
	const $to = view.state.doc.resolve(to);
	if(!$from.sameParent($to) || !$from.parent.isTextblock) {
		return false;
	}
	if(dispatch) {
		view.dispatch(view.state.tr.replaceRangeWith(from, to, node).scrollIntoView());
	}
	return true;
}

function getTrimmedSelection(state) {
	const selection = state.selection;
	if(selection.empty || selection.$from.parent !== selection.$to.parent || !selection.$from.parent.isTextblock) {
		return null;
	}
	const text = state.doc.textBetween(selection.from, selection.to, "", "\ufffc");
	const leading = text.length - text.trimStart().length;
	const trailing = text.length - text.trimEnd().length;
	const value = text.trim();
	if(!value || value.indexOf("\ufffc") !== -1 || /[\r\n]/.test(value)) {
		return null;
	}
	return {
		from: selection.from + leading,
		to: selection.to - trailing,
		text: value
	};
}

function wrapTransclusion(context, command, dispatch) {
	const view = getView(context);
	const selected = view && getTrimmedSelection(view.state);
	return selected ? replaceRangeWithInlineSource(
		view,
		selected.from,
		selected.to,
		"{{" + selected.text + "}}",
		dispatch
	) : false;
}

function selectionToWikiText(state) {
	if(!state || state.selection.empty) {
		return "";
	}
	const selectedJSON = state.selection.content().content.toJSON();
	return serializeProseMirrorNodes(stripSourceMetadata(selectedJSON), { atDocumentStart: true }).trimEnd();
}

function getSelectedTopLevelRange(state) {
	if(!state || !state.doc || !state.selection) {
		return null;
	}
	const selection = state.selection;
	let range = null;
	state.doc.forEach(function(node, offset) {
		const end = offset + node.nodeSize;
		const selected = selection.empty ?
			selection.from >= offset && selection.from <= end :
			selection.from < end && selection.to > offset;
		if(selected) {
			if(!range) {
				range = { from: offset, to: end, nodes: [] };
			} else {
				range.to = end;
			}
			range.nodes.push(node.toJSON());
		}
	});
	return range;
}

function replaceTopLevelRangeWithWikiText(context, range, source, dispatch) {
	const view = getView(context);
	const wiki = context && context.wiki;
	if(!view || !wiki || !range || typeof source !== "string") {
		return false;
	}
	let content;
	try {
		const parseWikiTextToDoc = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js").parseWikiTextToDoc;
		const parsedJSON = stripSourceMetadata(parseWikiTextToDoc(wiki, "text/vnd.tiddlywiki", source));
		content = view.state.schema.nodeFromJSON(parsedJSON).content;
	} catch(e) {
		return false;
	}
	if(dispatch) {
		view.dispatch(view.state.tr.replaceWith(range.from, range.to, content).scrollIntoView());
	}
	return true;
}

function transformSelectedTopLevelSource(context, transform, dispatch) {
	const view = getView(context);
	const range = view && getSelectedTopLevelRange(view.state);
	if(!range) {
		return false;
	}
	const source = serializeProseMirrorNodes(stripSourceMetadata(range.nodes), { atDocumentStart: true }).trimEnd();
	const transformed = transform(source);
	if(typeof transformed !== "string" || transformed === source) {
		return false;
	}
	return replaceTopLevelRangeWithWikiText(context, range, transformed, dispatch);
}

function prefixWikiTextLines(context, command, dispatch) {
	const parameters = getParameters(command);
	const character = typeof parameters.character === "string" ? parameters.character : "";
	const targetCount = parseInt(parameters.count, 10);
	if(!character || !Number.isFinite(targetCount) || targetCount < 1) {
		return false;
	}
	const prefix = character.repeat(targetCount);
	return transformSelectedTopLevelSource(context, function(source) {
		return source.split(/\r?\n/).map(function(line) {
			let count = 0;
			while(line.indexOf(character) === 0) {
				line = line.slice(character.length);
				count++;
			}
			line = line.replace(/^ +/, "");
			return count === targetCount ? line : prefix + " " + line;
		}).join("\n");
	}, dispatch);
}

function wrapWikiTextLines(context, command, dispatch) {
	const parameters = getParameters(command);
	const prefix = typeof parameters.prefix === "string" ? parameters.prefix.replace(/^\r?\n/, "") : "";
	const suffix = typeof parameters.suffix === "string" ? parameters.suffix : "";
	if(!prefix && !suffix) {
		return false;
	}
	return transformSelectedTopLevelSource(context, function(source) {
		const opening = prefix + "\n";
		const closing = "\n" + suffix;
		if(source.indexOf(opening) === 0 && source.slice(-closing.length) === closing) {
			return source.slice(opening.length, source.length - closing.length);
		}
		return opening + source + closing;
	}, dispatch);
}

function saveSelection(context, command, dispatch) {
	const view = getView(context);
	const wiki = context && context.wiki;
	const parameters = getParameters(command);
	const title = parameters.tiddler;
	const field = parameters.field || "text";
	if(!view || !wiki || !title || !field) {
		return false;
	}
	if(dispatch) {
		wiki.setText(title, field, null, selectionToWikiText(view.state));
	}
	return true;
}

function wrapWikiText(context, command, dispatch) {
	const view = getView(context);
	const parameters = getParameters(command);
	if(!view || view.state.selection.empty || typeof parameters.prefix !== "string" || typeof parameters.suffix !== "string" ||
		(!parameters.prefix && !parameters.suffix)) {
		return false;
	}
	let from = view.state.selection.from;
	let to = view.state.selection.to;
	let selectedSource;
	if(parameters.trimSelection === "yes") {
		const selected = getTrimmedSelection(view.state);
		if(!selected) {
			return false;
		}
		from = selected.from;
		to = selected.to;
		selectedSource = selected.text;
	} else {
		selectedSource = selectionToWikiText(view.state);
	}
	if(!selectedSource) {
		return false;
	}
	const rawText = parameters.prefix + selectedSource + parameters.suffix;
	const inlineSelection = view.state.selection.$from.sameParent(view.state.selection.$to) &&
		view.state.selection.$from.parent.isTextblock;
	const node = inlineSelection ? createInlineSourceNode(view.state, rawText) : createBlockSourceNode(view.state, rawText);
	if(!node) {
		return false;
	}
	if(dispatch) {
		const transaction = inlineSelection ?
			view.state.tr.replaceRangeWith(from, to, node).scrollIntoView() :
			view.state.tr.replaceSelectionWith(node).scrollIntoView();
		view.dispatch(transaction);
	}
	return true;
}

function exciseSelection(context, command, dispatch) {
	const view = getView(context);
	const wiki = context && context.wiki;
	const engine = context && context.engine;
	const parameters = getParameters(command);
	if(!view || !wiki || view.state.selection.empty) {
		return false;
	}
	const selectedSource = selectionToWikiText(view.state);
	if(!selectedSource) {
		return false;
	}
	const baseTitle = $tw.language.getString("Buttons/Excise/DefaultTitle");
	const excisionTitle = parameters.title || wiki.generateNewTitle(baseTitle);
	if(!excisionTitle || wiki.tiddlerExists(excisionTitle)) {
		return false;
	}
	const replacementType = parameters.type || "transclude";
	const from = view.state.selection.from;
	const to = view.state.selection.to;
	const inlineSelection = view.state.selection.$from.sameParent(view.state.selection.$to) &&
		view.state.selection.$from.parent.isTextblock;
	let transaction = null;
	if(replacementType === "link") {
		const linkType = view.state.schema.marks.link;
		if(!linkType) {
			return false;
		}
		const mark = linkType.create({ href: excisionTitle, title: excisionTitle });
		const linkedText = view.state.schema.text(excisionTitle, [mark]);
		transaction = inlineSelection ?
			view.state.tr.replaceWith(from, to, linkedText).scrollIntoView() :
			view.state.tr.replaceSelectionWith(view.state.schema.nodes.paragraph.create(null, linkedText)).scrollIntoView();
	} else {
		const rawText = replacementType === "macro" ?
			"<<" + (parameters.macro || "translink") + " \"\"\"" + excisionTitle + "\"\"\">>" :
			"{{" + excisionTitle + "}}";
		const node = inlineSelection ? createInlineSourceNode(view.state, rawText) : createBlockSourceNode(view.state, rawText);
		if(!node) {
			return false;
		}
		transaction = inlineSelection ?
			view.state.tr.replaceRangeWith(from, to, node).scrollIntoView() :
			view.state.tr.replaceSelectionWith(node).scrollIntoView();
	}
	if(!dispatch) {
		return true;
	}
	const widget = engine && engine.widget;
	const editTitle = widget && widget.editTitle;
	const editTiddler = editTitle && wiki.getTiddler(editTitle);
	const sourceTitle = editTiddler && editTiddler.fields["draft.of"] || editTitle;
	const contentType = context.contentType || engine && engine.type || "text/vnd.tiddlywiki";
	wiki.addTiddler(new $tw.Tiddler(
		wiki.getCreationFields(),
		wiki.getModificationFields(),
		{
			title: excisionTitle,
			text: selectedSource,
			tags: parameters.tagnew === "yes" && sourceTitle ? [sourceTitle] : [],
			type: contentType
		}
	));
	view.dispatch(transaction);
	return true;
}

function replaceAllWikiText(context, command, dispatch) {
	const view = getView(context);
	const wiki = context && context.wiki;
	const source = getParameters(command).text;
	if(!view || !wiki || typeof source !== "string") {
		return false;
	}
	if(dispatch) {
		const parseWikiTextToDoc = require("$:/plugins/tiddlywiki/prosemirror/core/editor-shared.js").parseWikiTextToDoc;
		const parsedJSON = parseWikiTextToDoc(wiki, "text/vnd.tiddlywiki", source);
		const parsedDoc = view.state.schema.nodeFromJSON(parsedJSON);
		let tr = view.state.tr.replaceWith(0, view.state.doc.content.size, parsedDoc.content);
		tr = tr.setSelection(TextSelection.atStart(tr.doc)).scrollIntoView();
		view.dispatch(tr);
		view.focus();
	}
	return true;
}

function insertSnippet(context, command, dispatch) {
	const view = getView(context);
	const wiki = context && context.wiki;
	const title = getParameters(command).title;
	const tiddler = wiki && wiki.getTiddler(title);
	if(!view || !tiddler || !tiddler.fields.text) {
		return false;
	}
	if(!dispatch) {
		return true;
	}
	const source = String(tiddler.fields.text);
	return replaceSelectionWithWikiText(context, source);
}

function insertBlockAdjacent(context, command, dispatch) {
	const view = getView(context);
	const block = getCurrentBlock(context);
	const paragraph = view && view.state.schema.nodes.paragraph;
	const node = paragraph && paragraph.createAndFill();
	if(!view || !block || !node) {
		return false;
	}
	if(dispatch) {
		const before = getParameters(command).direction === "before";
		const pos = before ? block.pos : block.pos + block.node.nodeSize;
		let tr = view.state.tr.insert(pos, node);
		tr = tr.setSelection(TextSelection.create(tr.doc, pos + 1)).scrollIntoView();
		view.dispatch(tr);
	}
	return true;
}

function duplicateBlock(context, command, dispatch) {
	const view = getView(context);
	const block = getCurrentBlock(context);
	if(!view || !block) {
		return false;
	}
	if(dispatch) {
		const copy = view.state.schema.nodeFromJSON(stripSourceMetadata(block.node.toJSON()));
		view.dispatch(view.state.tr.insert(block.pos + block.node.nodeSize, copy).scrollIntoView());
	}
	return true;
}

function deleteBlock(context, command, dispatch) {
	const view = getView(context);
	const block = getCurrentBlock(context);
	if(!view || !block) {
		return false;
	}
	if(dispatch) {
		let tr;
		if(view.state.doc.childCount === 1) {
			const paragraph = view.state.schema.nodes.paragraph.createAndFill();
			tr = view.state.tr.replaceWith(block.pos, block.pos + block.node.nodeSize, paragraph);
		} else {
			tr = view.state.tr.delete(block.pos, block.pos + block.node.nodeSize);
		}
		view.dispatch(tr.scrollIntoView());
	}
	return true;
}

function indentList(context, command, dispatch) {
	return runPmCommand(context, flatListCommands.indentListCommand, dispatch);
}

function dedentList(context, command, dispatch) {
	return runPmCommand(context, flatListCommands.dedentListCommand, dispatch);
}

const BUILTIN_HANDLERS = {
	"toggle-mark": toggleMark,
	"set-paragraph": setParagraph,
	"toggle-heading": toggleHeading,
	"toggle-code-block": toggleCodeBlock,
	"toggle-blockquote": toggleBlockquote,
	"toggle-list": toggleList,
	"insert-horizontal-rule": insertHorizontalRule,
	"insert-table": insertTable,
	"insert-hard-line-breaks": insertHardLineBreaks,
	"insert-typed-block": insertTypedBlock,
	"insert-wikitext": insertWikiText,
	"wrap-transclusion": wrapTransclusion,
	"wrap-wikitext": wrapWikiText,
	"prefix-wikitext-lines": prefixWikiTextLines,
	"wrap-wikitext-lines": wrapWikiTextLines,
	"save-selection": saveSelection,
	"excise-selection": exciseSelection,
	"replace-all-wikitext": replaceAllWikiText,
	"insert-snippet": insertSnippet,
	"insert-block-adjacent": insertBlockAdjacent,
	"duplicate-block": duplicateBlock,
	"delete-block": deleteBlock,
	"indent-list": indentList,
	"dedent-list": dedentList
};

let commandHandlers;

function getCommandHandlersInternal() {
	if(!commandHandlers) {
		commandHandlers = Object.assign({}, BUILTIN_HANDLERS);
		$tw.modules.applyMethods("prosemirroreditorcommand", commandHandlers);
	}
	return commandHandlers;
}

function canExecuteEditorCommand(context, command) {
	const handler = command && getCommandHandlersInternal()[command.commandId];
	if(!handler) {
		return false;
	}
	try {
		return !!handler(context, command, false);
	} catch(e) {
		return false;
	}
}

function executeEditorCommand(context, command) {
	const handler = command && getCommandHandlersInternal()[command.commandId];
	if(!handler) {
		return false;
	}
	const handled = !!handler(context, command, true);
	const view = getView(context);
	if(handled && view) {
		view.focus();
	}
	return handled;
}

function createCommand(commandId, parameters) {
	return {
		commandId: commandId,
		parameters: parameters || Object.create(null)
	};
}

function getCommandHandlers() {
	return Object.assign({}, getCommandHandlersInternal());
}

exports.canExecuteEditorCommand = canExecuteEditorCommand;
exports.executeEditorCommand = executeEditorCommand;
exports.createCommand = createCommand;
exports.getCommandHandlers = getCommandHandlers;
exports.createTable = createTable;
