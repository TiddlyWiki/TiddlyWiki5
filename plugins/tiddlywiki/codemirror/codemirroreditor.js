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

var CODEMIRROR_OPTIONS = "$:/config/CodeMirror", configOptions;
/* e.g. to allow vim key bindings
 * {
 *	"require": [
 *		"$:/plugins/tiddlywiki/codemirror/addon/dialog.js",
 *		"$:/plugins/tiddlywiki/codemirror/addon/searchcursor.js",
 *		"$:/plugins/tiddlywiki/codemirror/keymap/vim.js"
 *	],
 *	"configuration": {
 *			"keyMap": "vim",
 *			"showCursorWhenSelecting": true
 *	}
 *}
 */

var EditTextWidget = require("$:/core/modules/widgets/edit-text.js")["edit-text"];

if($tw.browser) {
	require("$:/plugins/tiddlywiki/codemirror/codemirror.js");

	configOptions = $tw.wiki.getTiddlerData(CODEMIRROR_OPTIONS,{});

	if(configOptions) {
		if(configOptions["require"]) {
				if(typeof configOptions["require"] === 'object' &&
						Object.prototype.toString.call(configOptions["require"]) == '[object Array]') {
					for (var idx=0; idx < configOptions["require"].length; idx++) {
						require(configOptions["require"][idx]);
					}
				}
				else {
					require(configOptions["require"]);
				}
		}
		EditTextWidget._configuration = configOptions["configuration"];
	}
}

/*
The edit-text widget calls this method just after inserting its dom nodes
*/
EditTextWidget.prototype.postRender = function() {
	var self = this,
		cm, config, cv, cm_opts = {
			lineWrapping: true,
			lineNumbers: true
		};

	if($tw.browser && window.CodeMirror && this.editTag === "textarea") {
		if(EditTextWidget._configuration) {
			for (cv in EditTextWidget._configuration) { cm_opts[cv] = EditTextWidget._configuration[cv]; }
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
