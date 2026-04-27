/*\
title: $:/plugins/tiddlywiki/prosemirror/core/source-panel.js
type: application/javascript
module-type: library

Side-by-side WikiText source panel for the ProseMirror editor.

\*/

"use strict";

const { debounce } = require("$:/core/modules/utils/debounce.js");

const SOURCE_STATE_TIDDLER = "$:/state/prosemirror/show-source";
const PREVIEW_STATE_TIDDLER = "$:/state/showeditpreview";

class SourcePanel {
	constructor(engine) {
		this.engine = engine;
		this._showing = false;
		this._manualShowing = false;
		this._dirtyFromSource = false;

		const wiki = engine.widget.wiki;

		this.panel = document.createElement("div");
		this.panel.className = "tc-prosemirror-source-panel";
		this.panel.style.display = "none";

		const label = document.createElement("div");
		label.className = "tc-prosemirror-source-label";
		label.textContent = wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/SourcePanel/Title", "WikiText Source");

		this.textarea = document.createElement("textarea");
		this.textarea.className = "tc-prosemirror-source-textarea tc-edit-texteditor";
		this.textarea.spellcheck = false;

		this.panel.appendChild(label);
		this.panel.appendChild(this.textarea);

		this._debouncedSync = debounce(() => {
			this.applySourceText();
		}, 500);
		this.textarea.addEventListener("input", () => {
			this._dirtyFromSource = true;
			this._debouncedSync();
		});

		this._manualShowing = this.isManualShowing();
		this._wikiChangeHandler = (changes) => {
			if(!changes) return;
			if(changes[SOURCE_STATE_TIDDLER]) {
				this._manualShowing = this.isManualShowing();
			}
			if(changes[SOURCE_STATE_TIDDLER] ||
				changes[PREVIEW_STATE_TIDDLER] ||
				changes[this.getPreviewStateTiddler()] ||
				changes["$:/config/ShowEditPreview/PerTiddler"]) {
				this.syncWithPreviewState();
			}
		};
		wiki.addEventListener("change", this._wikiChangeHandler);

		engine.domNode.appendChild(this.panel);
		this.syncWithPreviewState();
	}

	get showing() { return this._showing; }

	isManualShowing() {
		return this.engine.widget.wiki.getTiddlerText(SOURCE_STATE_TIDDLER) === "yes";
	}

	getPreviewStateTiddler() {
		const wiki = this.engine.widget.wiki;
		if(wiki.getTiddlerText("$:/config/ShowEditPreview/PerTiddler") !== "yes") {
			return PREVIEW_STATE_TIDDLER;
		}
		if(this.engine.widget && typeof this.engine.widget.getStateQualifier === "function") {
			return PREVIEW_STATE_TIDDLER + "-" + this.engine.widget.getStateQualifier();
		}
		return PREVIEW_STATE_TIDDLER;
	}

	isPreviewShowing() {
		return this.engine.widget.wiki.getTiddlerText(this.getPreviewStateTiddler(), "no") === "yes";
	}

	_applyVisibility(shouldShow) {
		if(shouldShow === this._showing) {
			if(shouldShow) {
				this.syncFromEditor();
			}
			return;
		}
		this._showing = shouldShow;
		if(shouldShow) {
			if(this._debouncedSync && this._debouncedSync.cancel) {
				this._debouncedSync.cancel();
			}
			this._dirtyFromSource = false;
			this.textarea.value = this.engine.getText();
			this.panel.style.display = "";
			this.engine.domNode.classList.add("tc-prosemirror-source-active");
		} else {
			if(this._dirtyFromSource) {
				this.flushPendingSync();
			} else if(this._debouncedSync && this._debouncedSync.cancel) {
				this._debouncedSync.cancel();
			}
			this.panel.style.display = "none";
			this.engine.domNode.classList.remove("tc-prosemirror-source-active");
		}
	}

	syncWithPreviewState() {
		this._applyVisibility(this._manualShowing || this.isPreviewShowing());
	}

	applySourceText() {
		if(!this._showing || !this.engine.view) return;
		const text = this.textarea.value;
		this.engine.updateDomNodeText(text);
		this.engine.widget.saveChanges(text);
		this._dirtyFromSource = false;
	}

	flushPendingSync() {
		if(this._debouncedSync && this._debouncedSync.flush) {
			this._debouncedSync.flush();
		}
	}

	syncFromEditor() {
		if(this._showing && this.textarea && document.activeElement !== this.textarea && !this._dirtyFromSource) {
			this.textarea.value = this.engine.getText();
		}
	}

	toggle() {
		this._manualShowing = !this._manualShowing;
		this.engine.widget.wiki.setText(SOURCE_STATE_TIDDLER, null, null,
			this._manualShowing ? "yes" : "no");
		this.syncWithPreviewState();
	}

	destroy() {
		if(this._wikiChangeHandler) {
			this.engine.widget.wiki.removeEventListener("change", this._wikiChangeHandler);
			this._wikiChangeHandler = null;
		}
	}
}

exports.SourcePanel = SourcePanel;
