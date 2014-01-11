/*\
title: $:/core/modules/widgets/edit-text-codemirror.js
type: application/javascript
module-type: widget

Extend the edit-text widget to use CodeMirror

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CODEMIRROR_KEYMAP = "$:/CodeMirrorKeymap",
		mode, modesAllowed = /^(vim|emacs)$/i;

var EditTextWidget = require("$:/core/modules/widgets/edit-text.js")["edit-text"];

if($tw.browser) {
	require("$:/plugins/tiddlywiki/codemirror/codemirror.js");
	mode = ($tw.wiki.getTiddlerText(CODEMIRROR_KEYMAP) || '').match(modesAllowed);
	if (mode) {
		require("$:/plugins/tiddlywiki/codemirror/addon/dialog.js");
		require("$:/plugins/tiddlywiki/codemirror/addon/searchcursor.js");
		if (mode[0].toLowerCase() === 'emacs') {
			require("$:/plugins/tiddlywiki/codemirror/keymap/emacs.js");
			EditTextWidget._codemirrorMode = 'emacs';
		}
		else {
			require("$:/plugins/tiddlywiki/codemirror/keymap/vim.js");
			EditTextWidget._codemirrorMode = 'vim';
		}
	}
}

/*
The edit-text widget calls this method just after inserting its dom nodes
*/
EditTextWidget.prototype.postRender = function() {
	var self = this,
		cm, cm_opts = {
			lineWrapping: true,
			lineNumbers: true
		};
	if($tw.browser && window.CodeMirror && this.editTag === "textarea") {
		if (EditTextWidget._codemirrorMode) {
			cm_opts["keyMap"] = EditTextWidget._codemirrorMode;
			cm_opts["showCursorWhenSelecting"] = true;
		}
		cm = CodeMirror.fromTextArea(this.domNodes[0], cm_opts);
		cm.on("change",function() {
			self.saveChanges(cm.getValue());
		});
	} else {
		cm = undefined;
	}
	this.codemirrorInstance = cm;
};

EditTextWidget.prototype.updateEditor = function(text) {
	// Replace the edit value if the tiddler we're editing has changed
	if(this.codemirrorInstance) {
		if(!this.codemirrorInstance.hasFocus()) {
			this.codemirrorInstance.setValue(text);
		}
	} else {
		this.updateEditorDomNode(this.getEditInfo().value);
	}
};

})();
