/*\
title: $:/plugins/tiddlywiki/prosemirror/core/widget.js
type: application/javascript
module-type: library

\*/

"use strict";

const { widget: Widget } = require("$:/core/modules/widgets/widget.js");
const { debounce } = require("$:/plugins/tiddlywiki/prosemirror/core/debounce.js");
const { from: wikiAstFromProseMirrorAst } = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js");
const { to: wikiAstToProseMirrorAst } = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js");
const { buildSchema } = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js");
const { buildPlugins, SlashMenuUI } = require("$:/plugins/tiddlywiki/prosemirror/core/plugin-list.js");
const { computeImageSrc } = require("$:/plugins/tiddlywiki/prosemirror/blocks/image/utils.js");

const { EditorState, NodeSelection, TextSelection } = require("prosemirror-state");
const { EditorView } = require("prosemirror-view");

class ProsemirrorWidget extends Widget {

	constructor(parseTreeNode, options) {
		super(parseTreeNode, options);
		this.pendingSavedText = null;
		this.pendingExternalText = null;
		this.pendingExternalType = null;
		this.lastSavedDocJSON = null;
		this.lastKnownText = "";
		this.lastKnownType = "text/vnd.tiddlywiki";
		this.applyingExternalText = false;
		this.imagePickerOpen = false;
		this.imagePickerInitialized = false;
		this.debouncedSaveEditorContent = debounce(this.saveEditorContent.bind(this), 300);
	}

	render(parent, nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();

		const tiddler = this.getAttribute("tiddler");
		const initialText = this.wiki.getTiddlerText(tiddler, "");
		const tiddlerRecord = tiddler ? this.wiki.getTiddler(tiddler) : null;
		this.editType = (tiddlerRecord && tiddlerRecord.fields && tiddlerRecord.fields.type) || "text/vnd.tiddlywiki";
		this.lastKnownText = initialText || "";
		this.lastKnownType = this.editType;

		let doc;
		try {
			const initialWikiAst = this.wiki.parseText(this.editType, initialText, {
				defaultType: "text/vnd.tiddlywiki"
			}).tree;
			doc = wikiAstToProseMirrorAst(initialWikiAst, { sourceText: initialText });
		} catch(e) {
			console.error("[ProseMirror] Error parsing initial content:", e);
			doc = { type: "doc", content: [{ type: "paragraph" }] };
		}

		const outerWrap = $tw.utils.domMaker("div", { class: "tc-prosemirror-wrapper" });
		const container = $tw.utils.domMaker("div", { class: "tc-prosemirror-container" });
		const mount = $tw.utils.domMaker("div", { class: "tc-prosemirror-mount" });
		container.appendChild(mount);
		outerWrap.appendChild(container);

		this._buildImagePicker(outerWrap);

		const schema = buildSchema();
		const plugins = buildPlugins(schema, this.wiki, this, this.editType);

		this.view = new EditorView(mount, {
			state: EditorState.create({
				doc: schema.nodeFromJSON(doc),
				plugins
			}),
			dispatchTransaction: (transaction) => {
				const newState = this.view.state.apply(transaction);
				this.view.updateState(newState);
				if(this.imagePickerOpen) this.updateImagePickerFromSelection();
				if(this.slashMenuUI) this.slashMenuUI.checkState();
				if(transaction.docChanged && !this.applyingExternalText) {
					this.clearPendingExternalText();
					this.debouncedSaveEditorContent();
				}
			}
		});

		this.view.dom.addEventListener("paste", (event) => {
			event.twEditor = true;
			event.stopPropagation();
		});
		this.view.dom.addEventListener("keydown", (event) => {
			event.twEditor = true;
			event.stopPropagation();
		});
		this.view.dom.addEventListener("blur", () => {
			setTimeout(() => this.applyPendingExternalText(), 0);
		}, true);
		container.setAttribute("data-tw-prosemirror-keycapture", "yes");

		this.slashMenuUI = new SlashMenuUI(this.view, { clickable: true });

		this.addEventListener("tm-prosemirror-image-picked", "handleProseMirrorImagePicked");
		this.addEventListener("tm-prosemirror-image-picked-nodeview", "handleProseMirrorImagePickedNodeView");

		parent.insertBefore(outerWrap, nextSibling);
		this.domNodes.push(outerWrap);

		this._renderImagePickerWidget();

		setTimeout(() => {
			try {
				this._syncListIndentation(outerWrap, container);
			} catch(e) { /* ignore */ }
		}, 0);
	}

	_buildImagePicker(outerWrap) {
		const imagePickerWrap = $tw.utils.domMaker("div", { class: "tc-prosemirror-imagepicker" });
		imagePickerWrap.style.display = "none";
		const imagePickerHeader = $tw.utils.domMaker("div", { class: "tc-prosemirror-imagepicker-header" });
		const imagePickerTitle = $tw.utils.domMaker("div", {
			class: "tc-prosemirror-imagepicker-title",
			text: "Image"
		});
		const imagePickerClose = $tw.utils.domMaker("button", {
			class: "tc-prosemirror-imagepicker-close",
			text: this.wiki.getTiddlerText("$:/language/Buttons/Close/Caption", "Close")
		});
		imagePickerClose.setAttribute("type", "button");
		imagePickerClose.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.closeImagePicker();
		});
		imagePickerHeader.appendChild(imagePickerTitle);
		imagePickerHeader.appendChild(imagePickerClose);
		imagePickerWrap.appendChild(imagePickerHeader);
		const imagePickerBody = $tw.utils.domMaker("div", { class: "tc-prosemirror-imagepicker-body" });
		imagePickerWrap.appendChild(imagePickerBody);
		outerWrap.appendChild(imagePickerWrap);
		this.imagePickerWrap = imagePickerWrap;
		this.imagePickerTitle = imagePickerTitle;
		this._imagePickerBody = imagePickerBody;
	}

	_renderImagePickerWidget() {
		try {
			const pickerWikitext = [
				"<$macrocall $name=\"image-picker\" actions=\"\"\"",
				"<$action-sendmessage $message=\"tm-prosemirror-image-picked\" imageTitle=<<imageTitle>>/>",
				"\"\"\"/>"
			].join("\n");
			const pickerTree = this.wiki.parseText("text/vnd.tiddlywiki", pickerWikitext).tree;
			const WidgetBase = require("$:/core/modules/widgets/widget.js").widget;
			this.imagePickerWidget = new WidgetBase({
				type: "element", tag: "div", children: pickerTree
			}, { wiki: this.wiki, parentWidget: this, document: this.document });
			this.imagePickerWidget.render(this._imagePickerBody, null);
			this.children.push(this.imagePickerWidget);
		} catch(e) { /* ignore */ }
		this.imagePickerWrap.style.display = "none";
	}

	_syncListIndentation(outerWrap, container) {
		const styleHost = (this.view && this.view.dom && this.view.dom.parentNode) || container || outerWrap;
		if(!styleHost || styleHost.__pmListIndentSet) return;

		const hostBody = (styleHost.closest && styleHost.closest(".tc-tiddler-body"))
		|| (outerWrap.closest && outerWrap.closest(".tc-tiddler-body"))
		|| outerWrap.parentNode;
		if(!hostBody || !hostBody.appendChild) return;

		const probeTextIndentPx = (tagName) => {
			const wrapper = document.createElement("div");
			Object.assign(wrapper.style, {
				position: "absolute", visibility: "hidden", pointerEvents: "none",
				left: "0", top: "0", margin: "0", padding: "0", border: "0",
				width: "1000px", overflow: "hidden"
			});
			const p = document.createElement("p");
			p.textContent = "X";
			p.style.margin = "0";
			p.style.padding = "0";
			const list = document.createElement(tagName);
			list.style.margin = "0";
			const li = document.createElement("li");
			li.textContent = "X";
			list.appendChild(li);
			wrapper.appendChild(p);
			wrapper.appendChild(list);
			hostBody.appendChild(wrapper);

			const rangeLeft = (textNode) => {
				if(!textNode) return null;
				const r = document.createRange();
				r.setStart(textNode, 0);
				r.setEnd(textNode, 1);
				const rect = r.getClientRects()[0];
				return rect ? rect.left : null;
			};

			const pLeft = rangeLeft(p.firstChild);
			const liLeft = rangeLeft(li.firstChild);
			wrapper.remove();
			if(pLeft == null || liLeft == null) return 0;
			return liLeft - pLeft;
		};

		const olIndentPx = probeTextIndentPx("ol");
		const ulIndentPx = probeTextIndentPx("ul");
		const chosenIndent = `${Math.max(olIndentPx || 0, ulIndentPx || 0, 40)}px`;
		styleHost.style.setProperty("--pm-list-indent", chosenIndent);
		styleHost.__pmListIndentSet = true;

		if(!styleHost.__pmListBlockGapSet) {
			const wrapper = document.createElement("div");
			Object.assign(wrapper.style, {
				position: "absolute", visibility: "hidden", pointerEvents: "none",
				left: "0", top: "0", margin: "0", padding: "0", border: "0",
				width: "1000px", overflow: "hidden"
			});
			const ul = document.createElement("ul");
			ul.appendChild(document.createElement("li")).textContent = "X";
			const ol = document.createElement("ol");
			ol.appendChild(document.createElement("li")).textContent = "X";
			wrapper.appendChild(ul);
			wrapper.appendChild(ol);
			hostBody.appendChild(wrapper);
			const ulRect = ul.getBoundingClientRect();
			const olRect = ol.getBoundingClientRect();
			wrapper.remove();
			const gapPx = (ulRect && olRect) ? Math.max(0, olRect.top - ulRect.bottom) : 15;
			styleHost.style.setProperty("--pm-list-block-gap", `${gapPx}px`);
			styleHost.__pmListBlockGapSet = true;
		}
	}

	getSelectedImageInfo() {
		if(!this.view || !this.view.state) return null;
		const sel = this.view.state.selection;
		if(sel && sel instanceof NodeSelection && sel.node && sel.node.type && sel.node.type.name === "image") {
			return { pos: sel.from, node: sel.node };
		}
		return null;
	}

	openImagePicker() {
		this.imagePickerOpen = true;
		this.updateImagePickerFromSelection();
	}

	closeImagePicker() {
		this.imagePickerOpen = false;
		this.updateImagePickerFromSelection();
	}

	updateImagePickerFromSelection() {
		if(!this.imagePickerWrap) return;
		const info = this.getSelectedImageInfo();
		if(!this.imagePickerOpen || !info) {
			this.imagePickerWrap.style.display = "none";
			this.imagePickerOpen = false;
			return;
		}
		this.imagePickerWrap.style.display = "block";
		const src = (info.node.attrs && info.node.attrs.twSource) || (info.node.attrs && info.node.attrs.src) || "";
		if(this.imagePickerTitle) {
			this.imagePickerTitle.textContent = this.wiki.getTiddlerText(
				"$:/plugins/tiddlywiki/prosemirror/language/ReplaceImage", "Replace image") + ": " + src;
		}
	}

	handleProseMirrorImagePicked(event) {
		const pickedTitle = event && event.paramObject && event.paramObject.imageTitle;
		if(!pickedTitle || !this.view) return true;
		const info = this.getSelectedImageInfo();
		if(!info) return true;
		const schema = this.view.state.schema;
		const imageType = schema.nodes.image;
		if(!imageType) return true;
		const oldAttrs = info.node.attrs || {};
		const newAttrs = Object.assign({}, oldAttrs, {
			twSource: pickedTitle,
			src: computeImageSrc(pickedTitle, this.wiki)
		});
		const newNode = imageType.create(newAttrs);
		let tr = this.view.state.tr.replaceWith(info.pos, info.pos + info.node.nodeSize, newNode);
		tr = tr.setSelection(NodeSelection.create(tr.doc, info.pos));
		this.view.dispatch(tr.scrollIntoView());
		this.view.focus();
		return false;
	}

	handleProseMirrorImagePickedNodeView(event) {
		const paramObj = event && event.paramObject;
		const nodeviewId = paramObj && (paramObj.nodeviewId || paramObj.nodeViewId);
		const pickedTitle = paramObj && paramObj.imageTitle;
		if(!nodeviewId || !pickedTitle || !this.view) return true;
		for(const el of this.view.dom.querySelectorAll(".pm-image-nodeview")) {
			const nodeview = el._imageNodeView;
			if(nodeview && typeof nodeview._getNodeViewId === "function" && nodeview._getNodeViewId() === nodeviewId) {
				if(typeof nodeview.handleImagePicked === "function") {
					nodeview.handleImagePicked(pickedTitle);
					return false;
				}
			}
		}
		return true;
	}

	saveEditorContent() {
		try {
			const content = this.view.state.doc.toJSON();
			const wikiast = wikiAstFromProseMirrorAst(content);
			const wikiText = $tw.utils.serializeWikitextParseTree(wikiast);
			const tiddler = this.getAttribute("tiddler");
			const currentText = this.wiki.getTiddlerText(tiddler, "");
			this.lastSavedDocJSON = content;
			if(currentText !== wikiText) {
				this.clearPendingExternalText();
				this.pendingSavedText = wikiText;
				try {
					this.wiki.setText(tiddler, "text", undefined, wikiText);
					this.lastKnownText = wikiText;
					this.lastKnownType = this.editType;
				} catch(e) {
					this.pendingSavedText = null;
					throw e;
				}
			} else {
				this.lastKnownText = currentText || "";
				this.lastKnownType = this.editType;
				if(this.pendingSavedText === wikiText) {
					this.pendingSavedText = null;
				}
			}
		} catch(e) {
			console.error("[ProseMirror] Error saving editor content:", e);
		}
	}

	clearPendingExternalText() {
		this.pendingExternalText = null;
		this.pendingExternalType = null;
	}

	applyPendingExternalText() {
		if(this.pendingExternalText === null || (this.view && this.view.hasFocus())) {
			return;
		}
		const nextText = this.pendingExternalText;
		const nextType = this.pendingExternalType || this.editType;
		this.clearPendingExternalText();
		this.editType = nextType;
		this.applyExternalText(nextText);
	}

	getPragmaPreamble() {
		if(!this.view || !this.view.state) return "";
		const parts = [];
		this.view.state.doc.forEach((node) => {
			if(node.type.name === "pragma_block" && node.attrs.rawText) {
				parts.push(node.attrs.rawText);
			}
		});
		return parts.length > 0 ? parts.join("\n") + "\n" : "";
	}

	onDestroy() {
		if(this.debouncedSaveEditorContent && this.debouncedSaveEditorContent.flush) {
			this.debouncedSaveEditorContent.flush();
		} else {
			try { this.saveEditorContent(); } catch(e) { /* ignore */ }
		}
		if(this.slashMenuUI) { this.slashMenuUI.destroy(); this.slashMenuUI = null; }
		if(this.view) { this.view.destroy(); this.view = null; }
	}

	execute() {
		// This widget renders the editor and picker manually and intentionally
		// skips the default child-widget expansion path.
		this.children = this.children || [];
	}

	refresh(changedTiddlers) {
		const changedAttributes = this.computeAttributes();
		if(changedAttributes.text) {
			this.refreshSelf();
			return true;
		} else if(changedTiddlers[this.getAttribute("tiddler")]) {
			const tiddler = this.getAttribute("tiddler");
			const nextText = this.wiki.getTiddlerText(tiddler, "") || "";
			const tiddlerRecord = tiddler ? this.wiki.getTiddler(tiddler) : null;
			const nextType = (tiddlerRecord && tiddlerRecord.fields && tiddlerRecord.fields.type) || "text/vnd.tiddlywiki";
			const typeChanged = nextType !== this.editType;
			if(this.pendingSavedText !== null && nextText === this.pendingSavedText && !typeChanged) {
				this.pendingSavedText = null;
				this.lastKnownText = nextText;
				this.lastKnownType = nextType;
				return false;
			}
			this.pendingSavedText = null;
			if(nextText === this.lastKnownText && !typeChanged) {
				return false;
			}
			// External change: apply incrementally
			if(!this.view || !this.view.hasFocus()) {
				this.editType = nextType;
				this.applyExternalText(nextText);
			} else {
				this.pendingExternalText = nextText;
				this.pendingExternalType = nextType;
			}
			return false;
		}
		return false;
	}

	/**
	 * Apply external tiddler text changes incrementally using ProseMirror's
	 * doc.replace(). Preserves undo history, marks, and cursor.
	 */
	applyExternalText(text) {
		if(!this.view) return;
		try {
			const nextText = text !== undefined ? text : this.wiki.getTiddlerText(this.getAttribute("tiddler"), "") || "";

			const reparsedWikiAst = this.wiki.parseText(this.editType, nextText, {
				defaultType: "text/vnd.tiddlywiki"
			}).tree;
			const reparsedDoc = wikiAstToProseMirrorAst(reparsedWikiAst, { sourceText: nextText });

			// Skip if reparsed text matches what we last saved
			if(this.lastSavedDocJSON && JSON.stringify(reparsedDoc) === JSON.stringify(this.lastSavedDocJSON)) {
				this.lastKnownText = nextText;
				this.lastKnownType = this.editType;
				return;
			}

			const newDoc = this.view.state.schema.nodeFromJSON(reparsedDoc);
			const oldDoc = this.view.state.doc;

			// Use doc.replace() for a properly structured replacement
			const slice = newDoc.slice(0, newDoc.content.size);
			let tr = this.view.state.tr;
			tr = tr.replace(0, oldDoc.content.size, slice);

			// Map cursor through the change
			const oldSel = this.view.state.selection;
			const newFrom = tr.mapping.map(oldSel.from);
			const newTo = tr.mapping.map(oldSel.to);
			try {
				tr = tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo));
			} catch(e) { /* leave default */ }

			tr = tr.setMeta("addToHistory", false);

			this.lastSavedDocJSON = newDoc.toJSON();
			this.lastKnownText = nextText;
			this.lastKnownType = this.editType;
			this.applyingExternalText = true;
			try {
				this.view.dispatch(tr);
			} finally{
				this.applyingExternalText = false;
			}
		} catch(e) {
			console.error("[ProseMirror] Error applying external text:", e);
			// Fallback: full rebuild
			this._fullRebuildFromTiddler();
		}
	}

	/**
	 * Full rebuild from tiddler text. Fallback only.
	 */
	_fullRebuildFromTiddler() {
		if(!this.view) return;
		try {
			const tiddler = this.getAttribute("tiddler");
			const nextText = this.wiki.getTiddlerText(tiddler, "");
			const tiddlerRecord = tiddler ? this.wiki.getTiddler(tiddler) : null;
			this.editType = (tiddlerRecord && tiddlerRecord.fields && tiddlerRecord.fields.type) || "text/vnd.tiddlywiki";
			const wikiAst = this.wiki.parseText(this.editType, nextText, {
				defaultType: "text/vnd.tiddlywiki"
			}).tree;
			const pmDoc = wikiAstToProseMirrorAst(wikiAst, { sourceText: nextText });
			const newDoc = this.view.state.schema.nodeFromJSON(pmDoc);
			const plugins = buildPlugins(this.view.state.schema, this.wiki, this, this.editType);
			const state = EditorState.create({ doc: newDoc, plugins: plugins });
			this.view.updateState(state);
			this.lastSavedDocJSON = newDoc.toJSON();
			this.lastKnownText = nextText || "";
			this.lastKnownType = this.editType;
		} catch(e) {
			console.error("[ProseMirror] Error rebuilding content:", e);
		}
	}

}

exports.prosemirror = ProsemirrorWidget;
