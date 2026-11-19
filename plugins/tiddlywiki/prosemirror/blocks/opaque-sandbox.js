/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/opaque-sandbox.js
type: application/javascript
module-type: library

Block-local tiddler bridge for interactive opaque WikiText rules.

\*/

"use strict";

const SANDBOX_BASE_TITLE = "$:/temp/ProseMirror/RenderedBlock";

class OpaqueSourceSandbox {
	constructor(wiki, onTextChange, options) {
		options = options || {};
		this.wiki = wiki;
		this.onTextChange = onTextChange;
		this.sourceTitle = options.sourceTitle || "";
		this.title = null;
		this.sourceText = "";
		this._changeHandler = (changes) => this._handleWikiChange(changes);
	}

	ensure(sourceText) {
		this.sourceText = sourceText || "";
		if(!this.title) {
			this.title = this.wiki.generateNewTitle(SANDBOX_BASE_TITLE, { prefix: "/" });
			const sourceTiddler = this.sourceTitle && this.wiki.getTiddler(this.sourceTitle);
			const fields = sourceTiddler ? Object.assign({}, sourceTiddler.fields) : {};
			Object.assign(fields, {
				title: this.title,
				type: "text/vnd.tiddlywiki",
				text: this.sourceText
			});
			this.wiki.addTiddler(fields);
			this.wiki.addEventListener("change", this._changeHandler);
		} else if(this.wiki.getTiddlerText(this.title, "") !== this.sourceText) {
			this.wiki.setText(this.title, "text", null, this.sourceText, {
				suppressTimestamp: true
			});
		}
		return this.title;
	}

	getVariables() {
		if(!this.title) {
			return {};
		}
		const variables = { currentTiddler: this.title };
		if(this.sourceTitle) {
			variables.prosemirrorSourceTiddler = this.sourceTitle;
		}
		return variables;
	}

	_handleWikiChange(changes) {
		if(!this.title || !changes || !changes[this.title]) {
			return;
		}
		const nextText = this.wiki.getTiddlerText(this.title, "");
		if(nextText !== this.sourceText) {
			this.sourceText = nextText;
			this.onTextChange(nextText);
		}
	}

	destroy() {
		if(!this.title) {
			return;
		}
		this.wiki.removeEventListener("change", this._changeHandler);
		this.wiki.deleteTiddler(this.title);
		this.title = null;
		this.sourceText = "";
	}
}

exports.OpaqueSourceSandbox = OpaqueSourceSandbox;
exports.SANDBOX_BASE_TITLE = SANDBOX_BASE_TITLE;
