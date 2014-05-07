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
/*
e.g. to allow vim key bindings
 {
	"require": [
		"$:/plugins/tiddlywiki/codemirror/addon/dialog/dialog.js",
		"$:/plugins/tiddlywiki/codemirror/addon/search/searchcursor.js",
		"$:/plugins/tiddlywiki/codemirror/keymap/vim.js"
	],
	"configuration": {
			"keyMap": "vim",
			"showCursorWhenSelecting": true
	}
}
*/

var EditTextWidget = require("$:/core/modules/widgets/edit-text.js")["edit-text"];

if($tw.browser) {
	window.CodeMirror = require("$:/plugins/tiddlywiki/codemirror/lib/codemirror.js");

	configOptions = $tw.wiki.getTiddlerData(CODEMIRROR_OPTIONS,{});

	if(configOptions) {
		if(configOptions["require"]) {
				if($tw.utils.isArray(configOptions["require"])) {
					for (var index=0; index < configOptions["require"].length; index++) {
						require(configOptions["require"][index]);
					}
				}
				else {
					require(configOptions["require"]);
				}
		}
		EditTextWidget.configuration = configOptions["configuration"];
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
		if(EditTextWidget.configuration) {
			for (cv in EditTextWidget.configuration) { cm_opts[cv] = EditTextWidget.configuration[cv]; }
		}
		cm = window.CodeMirror.fromTextArea(this.domNodes[0], cm_opts);
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
