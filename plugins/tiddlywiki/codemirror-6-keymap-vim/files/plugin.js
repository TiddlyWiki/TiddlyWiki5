/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/keymap-vim/plugin.js
type: application/javascript
module-type: codemirror6-plugin

Vim keybindings for CodeMirror 6

\*/
"use strict";

if(!$tw.browser) return;

var vimModule = require("$:/plugins/tiddlywiki/codemirror-6/plugins/keymap-vim/codemirror-vim.js");

var ESCAPE_CONSUMED_TIDDLER = "$:/temp/codemirror-6/vim-escape-consumed";

// Map from EditorView to context
var viewToContext = new WeakMap();

// Helper to get context from CodeMirror vim adapter
function getContextFromCM(cm) {
	if(cm && cm.cm6) {
		return viewToContext.get(cm.cm6);
	}
	return null;
}

// Define custom ex commands for TiddlyWiki integration
if(vimModule && vimModule.Vim) {
	// :w - save tiddler without closing (persist draft to original tiddler)
	vimModule.Vim.defineEx("write", "w", function(cm, _params) {
		var context = getContextFromCM(cm);
		var widget = context && context.options && context.options.widget;
		if(widget && widget.wiki) {
			var draftTitle = widget.editTitle;
			var draftTiddler = widget.wiki.getTiddler(draftTitle);
			if(draftTiddler && draftTiddler.fields["draft.of"]) {
				var originalTitle = draftTiddler.fields["draft.of"];
				// Copy draft fields to original, excluding draft-specific fields
				var newFields = {};
				for(var field in draftTiddler.fields) {
					if(field !== "draft.of" && field !== "draft.title") {
						newFields[field] = draftTiddler.fields[field];
					}
				}
				// Restore original title
				newFields.title = originalTitle;
				// Save to original tiddler
				widget.wiki.addTiddler(new $tw.Tiddler(newFields));
			}
		}
	});

	// :wq - save and close tiddler
	vimModule.Vim.defineEx("wq", "wq", function(cm, _params) {
		var context = getContextFromCM(cm);
		var widget = context && context.options && context.options.widget;
		if(widget) {
			var draftTitle = widget.editTitle;
			widget.dispatchEvent({
				type: "tm-save-tiddler",
				param: draftTitle,
				tiddlerTitle: draftTitle
			});
		}
	});

	// :q - close/cancel tiddler (discard changes)
	vimModule.Vim.defineEx("quit", "q", function(cm, _params) {
		var context = getContextFromCM(cm);
		var widget = context && context.options && context.options.widget;
		if(widget) {
			var draftTitle = widget.editTitle;
			widget.dispatchEvent({
				type: "tm-cancel-tiddler",
				param: draftTitle,
				tiddlerTitle: draftTitle
			});
		}
	});
}

// Register hook to prevent tiddler cancel when vim consumed the Escape
$tw.hooks.addHook("th-cancelling-tiddler", function(event) {
	var consumed = $tw.wiki.getTiddlerText(ESCAPE_CONSUMED_TIDDLER, "no");
	if(consumed === "yes") {
		// Clear the flag
		$tw.wiki.deleteTiddler(ESCAPE_CONSUMED_TIDDLER);
		// Return a fake event with no tiddler info - this will cause the cancel to do nothing
		// (the navigator checks if draftTiddler exists before proceeding)
		return {
			event: {},
			param: null,
			tiddlerTitle: null
		};
	}
	return event;
});

exports.plugin = {
	name: "keymap-vim",
	description: "Vim keybindings",
	priority: 50,
	keymapId: "vim",

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	getExtensions: function(context) {
		// The engine calls this only when vim keymap is selected
		if(!vimModule || !vimModule.vim) {
			return [];
		}

		var wiki = context.options && context.options.widget && context.options.widget.wiki || $tw.wiki;
		var ViewPlugin = this._core.view.ViewPlugin;

		// ViewPlugin to store context and intercept Escape
		var vimHelper = ViewPlugin.define(function(view) {
			// Store context in WeakMap for ex commands to access
			viewToContext.set(view, context);

			// Capture phase handler - runs BEFORE TiddlyWiki processes the key
			var escapeCapture = function(event) {
				if(event.key !== "Escape") return;

				var cm = vimModule.getCM(view);
				if(cm && cm.state && cm.state.vim) {
					var mode = cm.state.vim.mode || "normal";
					if(mode !== "normal") {
						// Set flag so the th-cancelling-tiddler hook prevents tiddler cancellation
						wiki.setText(ESCAPE_CONSUMED_TIDDLER, "text", null, "yes");

						// Manually exit insert/visual mode since TiddlyWiki's keyboard widget
						// will intercept the event before vim can process it
						if(vimModule.Vim && vimModule.Vim.exitInsertMode) {
							vimModule.Vim.exitInsertMode(cm);
						} else if(cm.state.vim.insertMode) {
							// Fallback: directly modify vim state
							cm.state.vim.insertMode = false;
							cm.state.vim.mode = "normal";
						}
					}
				}
			};

			view.contentDOM.addEventListener("keydown", escapeCapture, true);

			return {
				destroy: function() {
					view.contentDOM.removeEventListener("keydown", escapeCapture, true);
					viewToContext.delete(view);
				}
			};
		});

		return [vimModule.vim(), vimHelper];
	}
};
