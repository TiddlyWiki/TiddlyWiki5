/*\
title: $:/plugins/tiddlywiki/prosemirror/core/editor-shared.js
type: application/javascript
module-type: library

Shared editor helpers for the factory engine. Covers parse/serialize,
external text sync, and full editor-state rebuilds.

\*/

"use strict";

const { EditorState, TextSelection } = require("prosemirror-state");
const { to: wikiAstToProseMirrorAst } = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js");
const serializeProseMirrorNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/serialize-wikitext.js").serializeProseMirrorNodes;
const {
	serializeWithPreservedSource,
	stripSourceMetadata
} = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js");
const { buildPlugins } = require("$:/plugins/tiddlywiki/prosemirror/core/plugin-list.js");
const { replaceChangedContent } = require("$:/plugins/tiddlywiki/prosemirror/core/incremental-sync.js");

function sourceTextToDoc(text) {
	return {
		type: "doc",
		content: [{
			type: "opaque_block",
			attrs: {
				rawText: text,
				firstLine: (text.split("\n")[0] || text).trim(),
				parseTreeJson: null,
				autoEdit: false
			}
		}]
	};
}

function parseWikiTextToDoc(wiki, type, text) {
	text = text || "";
	if(type !== "text/vnd.tiddlywiki") {
		return sourceTextToDoc(text);
	}
	try {
		const wikiAst = wiki.parseText(type, text, {
			defaultType: "text/vnd.tiddlywiki",
			preserveBlankLines: false
		}).tree;
		return wikiAstToProseMirrorAst(wikiAst, {
			sourceText: text,
			sourceType: type,
			wiki: wiki,
			preserveSource: true
		});
	} catch(e) {
		// Preserve the entire source even when an extension's parser fails.
		// Never substitute an empty document that could later overwrite it.
		return sourceTextToDoc(text);
	}
}

function serializeDocJSON(docJSON) {
	return serializeWithPreservedSource(docJSON, serializeProseMirrorNodes);
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
	return JSON.stringify(stripSourceMetadata(left)) === JSON.stringify(stripSourceMetadata(right));
}

function getSchema(owner) {
	return owner.schema || (owner.view && owner.view.state && owner.view.state.schema);
}

function dispatchExternalTransaction(owner, transaction) {
	if(!transaction.docChanged) {
		return;
	}
	owner.applyingExternalText = true;
	try {
		owner.view.dispatch(transaction.setMeta("addToHistory",false));
	} finally{
		owner.applyingExternalText = false;
	}
}

function rebaseSourceMetadata(owner, newDoc) {
	let transaction = owner.view.state.tr;
	owner.view.state.doc.forEach(function(oldNode, offset, index) {
		const newNode = newDoc.child(index);
		if(JSON.stringify(oldNode.attrs) !== JSON.stringify(newNode.attrs)) {
			transaction = transaction.setNodeMarkup(offset,undefined,newNode.attrs,oldNode.marks);
		}
	});
	return transaction;
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
		const currentDocJSON = owner.view.state.doc.toJSON();

		// A semantic match is not enough: an external source editor may have
		// changed whitespace or syntax spelling without changing the PM tree.
		// Only skip when the current view already serializes to the exact incoming
		// text; otherwise replace the provenance attrs with the external source.
		if(isSameDocJSON(reparsedDoc, currentDocJSON) && serializeDocJSON(currentDocJSON) === nextText) {
			if(options.afterApply) {
				options.afterApply(owner, nextText, type);
			}
			return;
		}

		const schema = getSchema(owner);
		const newDoc = schema.nodeFromJSON(reparsedDoc);
		const oldDoc = owner.view.state.doc;
		if(isSameDocJSON(reparsedDoc, currentDocJSON)) {
			owner.lastSavedDocJSON = newDoc.toJSON();
			if(options.afterApply) {
				options.afterApply(owner, nextText, type);
			}
			dispatchExternalTransaction(owner,rebaseSourceMetadata(owner,newDoc));
			return;
		}

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

		owner.lastSavedDocJSON = newDoc.toJSON();
		if(options.afterApply) {
			options.afterApply(owner, nextText, type);
		}
		dispatchExternalTransaction(owner,tr);
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
exports.sourceTextToDoc = sourceTextToDoc;
exports.serializeDocJSON = serializeDocJSON;
exports.getPragmaPreamble = getPragmaPreamble;
exports.applyExternalText = applyExternalText;
exports.rebuildEditorState = rebuildEditorState;
