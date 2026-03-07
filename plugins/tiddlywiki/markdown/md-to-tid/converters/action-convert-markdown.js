/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/action-convert-markdown.js
type: application/javascript
module-type: widget

Action widget to convert markdown tiddler to wikitext

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

class ActionConvertMarkdownWidget extends Widget {
	render(parent, nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();
		// Render children
		this.renderChildren(parent, nextSibling);
	}

	execute() {
		this.tiddlerTitle = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
		// Construct the child widgets
		this.makeChildWidgets();
	}

	refresh(changedTiddlers) {
		const changedAttributes = this.computeAttributes();
		if(changedAttributes["$tiddler"]) {
			this.refreshSelf();
			return true;
		}
		return this.refreshChildren(changedTiddlers);
	}

	invokeAction(triggeringWidget, event) {
		const tiddlerTitle = this.tiddlerTitle;
		if(!tiddlerTitle) {
			this.setVariable("success", "no");
			return false;
		}

		const tiddler = this.wiki.getTiddler(tiddlerTitle);
		if(!tiddler) {
			this.setVariable("success", "no");
			return false;
		}

		const type = tiddler.fields.type || "text/vnd.tiddlywiki";
		if(type !== "text/x-markdown" && type !== "text/markdown") {
			this.setVariable("success", "no");
			return false;
		}

		if(!$tw.utils.markdownTextToWikiAST) {
			this.setVariable("success", "no");
			return false;
		}

		try {
			const markdownText = tiddler.fields.text || "";
			const wikiAST = $tw.utils.markdownTextToWikiAST(markdownText);
			const wikitext = $tw.utils.serializeWikitextParseTree(wikiAST);

			this.wiki.addTiddler(new $tw.Tiddler(
				tiddler,
				{
					text: wikitext,
					type: "text/vnd.tiddlywiki"
				}
			));

			this.setVariable("success", "yes");
			this.setVariable("targetTiddler", this.tiddlerTitle);
			return true;
		} catch(e) {
			console.error("Error converting markdown:", e);
			this.setVariable("success", "no");
			this.setVariable("targetTiddler", this.tiddlerTitle);
			this.setVariable("errorMessage", e.message || "Unknown error");
			return false;
		}
	}
}

exports["action-convert-markdown"] = ActionConvertMarkdownWidget;
