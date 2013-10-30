/*\
title: $:/core/modules/new_widgets/edit-text-codemirror.js
type: application/javascript
module-type: new_widget

Extend the edit-text widget to use CodeMirror

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.browser) {
    require("$:/plugins/tiddlywiki/codemirror/codemirror.js");
}

var EditTextWidget = require("$:/core/modules/new_widgets/edit-text.js")["edit-text"];

/*
The edit-text widget calls this method just after inserting its dom nodes
*/
EditTextWidget.prototype.postRender = function() {
	var self = this,
		cm;
	if($tw.browser && window.CodeMirror && this.editTag === "textarea") {
		cm = CodeMirror.fromTextArea(this.domNodes[0],{
			lineWrapping: true,
			lineNumbers: true
		});
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
