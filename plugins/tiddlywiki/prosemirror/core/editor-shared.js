/*\
title: $:/plugins/tiddlywiki/prosemirror/core/editor-shared.js
type: application/javascript
module-type: library

Shared editor helpers used by the factory engine and the standalone
<$edit-prosemirror> widget. Covers parse/serialize, external text sync,
and full rebuild so both entry points keep the same round-trip behaviour.

\*/

"use strict";

const { EditorState, TextSelection } = require("prosemirror-state");
const { from: wikiAstFromProseMirrorAst } = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js");
const { to: wikiAstToProseMirrorAst } = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js");
const { buildPlugins } = require("$:/plugins/tiddlywiki/prosemirror/core/plugin-list.js");
const { replaceChangedContent } = require("$:/plugins/tiddlywiki/prosemirror/core/incremental-sync.js");

function parseWikiTextToDoc(wiki, type, text) {
	const wikiAst = wiki.parseText(type, text || "", {
		defaultType: "text/vnd.tiddlywiki",
		preserveBlankLines: true
	}).tree;
	return wikiAstToProseMirrorAst(wikiAst, { sourceText: text || "" });
}

function serializeDocJSON(docJSON) {
	const wikiAst = wikiAstFromProseMirrorAst(docJSON);
	return $tw.utils.serializeWikitextParseTree(wikiAst);
}

function getPragmaPreamble(view) {
	if(!view || !view.state) {
		return "";
	}
	const parts = [];
	view.state.doc.forEach(function(node) {
		if(node.type.name === "pragma_block" && node.attrs.rawText) {
			parts.push(node.attrs.rawText);
		}
	});
	return parts.length > 0 ? parts.join("\n") + "\n" : "";
}

function isSameDocJSON(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function getSchema(owner) {
	return owner.schema || (owner.view && owner.view.state && owner.view.state.schema);
}

function applyExternalText(owner, text, options) {
	options = options || {};
	if(!owner.view) {
		return;
	}
	try {
		const nextText = options.resolveText ? options.resolveText(owner, text) : (text || "");
		const type = options.getType ? options.getType(owner) : owner.type;
		const reparsedDoc = parseWikiTextToDoc(owner.wiki, type, nextText);

		if(owner.lastSavedDocJSON && isSameDocJSON(reparsedDoc, owner.lastSavedDocJSON)) {
			if(options.afterApply) {
				options.afterApply(owner, nextText, type);
			}
			return;
		}

		const schema = getSchema(owner);
		const newDoc = schema.nodeFromJSON(reparsedDoc);
		const oldDoc = owner.view.state.doc;

		let tr = owner.view.state.tr;
		const diff = replaceChangedContent(tr, oldDoc, newDoc);
		if(!diff.changed) {
			owner.lastSavedDocJSON = newDoc.toJSON();
			if(options.afterApply) {
				options.afterApply(owner, nextText, type);
			}
			return;
		}
		tr = diff.transaction;

		const oldSel = owner.view.state.selection;
		const newFrom = tr.mapping.map(oldSel.from);
		const newTo = tr.mapping.map(oldSel.to);
		try {
			tr = tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo));
		} catch(e) { /* leave default selection */ }

		tr = tr.setMeta("addToHistory", false);

		owner.lastSavedDocJSON = newDoc.toJSON();
		if(options.afterApply) {
			options.afterApply(owner, nextText, type);
		}
		owner.applyingExternalText = true;
		try {
			owner.view.dispatch(tr);
		} finally{
			owner.applyingExternalText = false;
		}
	} catch(e) {
		console.error("[ProseMirror] Error applying external text:", e);
		if(options.onError) {
			options.onError(owner, text, e);
		}
	}
}

function rebuildEditorState(owner, text, options) {
	options = options || {};
	if(!owner.view) {
		return;
	}
	try {
		const nextText = text || "";
		const type = options.getType ? options.getType(owner) : owner.type;
		const schema = getSchema(owner);
		const pmDoc = parseWikiTextToDoc(owner.wiki, type, nextText);
		const newDoc = schema.nodeFromJSON(pmDoc);
		const plugins = buildPlugins(schema, owner.wiki, owner, type);
		const state = EditorState.create({ doc: newDoc, plugins: plugins });
		owner.view.updateState(state);
		owner.lastSavedDocJSON = newDoc.toJSON();
		if(options.afterApply) {
			options.afterApply(owner, nextText, type);
		}
	} catch(e) {
		console.error("[ProseMirror] Error rebuilding content:", e);
	}
}

exports.parseWikiTextToDoc = parseWikiTextToDoc;
exports.serializeDocJSON = serializeDocJSON;
exports.getPragmaPreamble = getPragmaPreamble;
exports.applyExternalText = applyExternalText;
exports.rebuildEditorState = rebuildEditorState;
