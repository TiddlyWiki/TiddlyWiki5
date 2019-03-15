/*\
title: $:/plugins/tiddlywiki/codemirror/engine.js
type: application/javascript
module-type: library

Text editor engine based on a CodeMirror instance

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CODEMIRROR_OPTIONS = "$:/config/CodeMirror",
HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height",
CONFIG_FILTER = "[all[shadows+tiddlers]prefix[$:/config/codemirror/]]"
	
// Install CodeMirror
if($tw.browser && !window.CodeMirror) {

	var modules = $tw.modules.types["codemirror"];
	var req = Object.getOwnPropertyNames(modules);

	window.CodeMirror = require("$:/plugins/tiddlywiki/codemirror/lib/codemirror.js");
	// Install required CodeMirror plugins
	if(req) {
		if($tw.utils.isArray(req)) {
			for(var index=0; index<req.length; index++) {
				require(req[index]);
			}
		} else {
			require(req);
		}
	}
}

function CodeMirrorEngine(options) {

	// Save our options
	var self = this;
	options = options || {};
	this.widget = options.widget;
	this.value = options.value;
	this.parentNode = options.parentNode;
	this.nextSibling = options.nextSibling;
	// Create the wrapper DIV
	this.domNode = this.widget.document.createElement("div");
	if(this.widget.editClass) {
		this.domNode.className = this.widget.editClass;
	}
	this.domNode.style.display = "inline-block";
	this.parentNode.insertBefore(this.domNode,this.nextSibling);
	this.widget.domNodes.push(this.domNode);
	
	// Set all cm-plugin defaults
	// Get the configuration options for the CodeMirror object
	var config = this.getCmConfig();

	config.mode = options.type;
	config.value = options.value;
	if(this.widget.editTabIndex) {
		config["tabindex"] = this.widget.editTabIndex;
	}
	// Create the CodeMirror instance
	this.cm = window.CodeMirror(function(cmDomNode) {
		// Note that this is a synchronous callback that is called before the constructor returns
		if(!self.widget.document.isTiddlyWikiFakeDom) {
			self.domNode.appendChild(cmDomNode);
		}
	},config);

	// Set up a change event handler
	this.cm.on("change",function() {
		self.widget.saveChanges(self.getText());
	});
	this.cm.on("drop",function(cm,event) {
		event.stopPropagation(); // Otherwise TW's dropzone widget sees the drop event
		return false;
	});
	this.cm.on("keydown",function(cm,event) {
		return self.widget.handleKeydownEvent.call(self.widget,event);
	});
}

/*
Collect configuration options
*/
CodeMirrorEngine.prototype.getCmConfig = function() {
	var type,
	    element,
	    tiddler,
	    config = {},
	    configTiddlers = $tw.wiki.filterTiddlers(CONFIG_FILTER);

	if ($tw.utils.isArray(configTiddlers)) {
		for (var i=0; i<configTiddlers.length; i++) {
			tiddler = $tw.wiki.getTiddler(configTiddlers[i]);
			if (tiddler) {
				element = configTiddlers[i].replace(/\$:\/config\/codemirror\//ig,"");
				type = (tiddler.fields.type) ? tiddler.fields.type.trim().toLocaleLowerCase() : "string";
				this.assignConfigurationValues(tiddler,type,element,config);
			}
		}
	}
	return config;
};

/*
Set the text of the engine if it doesn't currently have focus
*/
CodeMirrorEngine.prototype.setText = function(text,type) {
	var self = this;
	self.cm.setOption("mode",type);
	if(!this.cm.hasFocus()) {
		this.cm.setValue(text);
	}
};

/*
Get the text of the engine
*/
CodeMirrorEngine.prototype.getText = function() {
	return this.cm.getValue();
};

/*
Fix the height of textarea to fit content
*/
CodeMirrorEngine.prototype.fixHeight = function() {
	if(this.widget.editAutoHeight) {
		// Resize to fit
		this.cm.setSize(null,null);
	} else {
		var fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE,"400px"),10);
		fixedHeight = Math.max(fixedHeight,20);
		this.cm.setSize(null,fixedHeight);
	}
};

/*
Focus the engine node
*/
CodeMirrorEngine.prototype.focus  = function() {
	this.cm.focus();
}

/*
Create a blank structure representing a text operation
*/
CodeMirrorEngine.prototype.createTextOperation = function() {
	var selections = this.cm.listSelections();
	if(selections.length > 0) {
		var anchorPos = this.cm.indexFromPos(selections[0].anchor),
		headPos = this.cm.indexFromPos(selections[0].head);
	}
	var operation = {
		text: this.cm.getValue(),
		selStart: Math.min(anchorPos,headPos),
		selEnd: Math.max(anchorPos,headPos),
		cutStart: null,
		cutEnd: null,
		replacement: null,
		newSelStart: null,
		newSelEnd: null
	};
	operation.selection = operation.text.substring(operation.selStart,operation.selEnd);
	return operation;
};

/*
Execute a text operation
*/
CodeMirrorEngine.prototype.executeTextOperation = function(operation) {
	// Perform the required changes to the text area and the underlying tiddler
	var newText = operation.text;
	if(operation.replacement !== null) {
		this.cm.replaceRange(operation.replacement,this.cm.posFromIndex(operation.cutStart),this.cm.posFromIndex(operation.cutEnd));
		this.cm.setSelection(this.cm.posFromIndex(operation.newSelStart),this.cm.posFromIndex(operation.newSelEnd));
		newText = operation.text.substring(0,operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd);
	}
	this.cm.focus();
	return newText;
};

/*
Extract configuration values from codemirror configuration tiddlers
*/
CodeMirrorEngine.prototype.assignConfigurationValues = function(tiddler,type,cmOption,config) {
	var test,
	    value,
	    extend;
	switch (type) {
		case "bool":
		test = tiddler.fields.text.trim().toLowerCase();
		value = (test === "true") ? true : false;
		config[cmOption] = value;
		break;
		case "string":
		value = tiddler.fields.text.trim();
		config[cmOption] = value;
		break;
		case "integer":
		value = parseInt(tiddler.fields.text.trim(), 10);
		config[cmOption] = value;
		break;
		case "json":
		value = JSON.parse(tiddler.fields.text.trim());
			extend = (tiddler.fields.extend) ? tiddler.fields.extend : cmOption;

		if (config[extend]) {
			$tw.utils.extend(config[extend], value);
		} else {
			config[extend] = value;
		}
		break;
	}
};

/*
Update CodeMirror options when configuration tiddlers change
*/
CodeMirrorEngine.prototype.refreshCodeMirrorOptions = function(changedTiddlers) {
	var self = this,
	    configTiddlers = $tw.wiki.filterTiddlers(CONFIG_FILTER),
	    config = {},
	    hasChanged;
	for(var i=0; i<configTiddlers.length; i++) {
		if(changedTiddlers[configTiddlers[i]]) {
			hasChanged = true;
			var cmOption = configTiddlers[i].replace(/\$:\/config\/codemirror\//ig,""),
			    tiddler = this.widget.wiki.getTiddler(configTiddlers[i]);
			var type = (tiddler.fields.type) ? tiddler.fields.type.trim().toLocaleLowerCase() : "string";
			this.assignConfigurationValues(tiddler,type,cmOption,config);
		}
	}
	if(hasChanged) {
		$tw.utils.each(Object.keys(config),function(cmConfigOption) {
			self.cm.setOption(cmConfigOption,config[cmConfigOption]);
		});
	}
	return true;
};

exports.CodeMirrorEngine = CodeMirrorEngine;

})();
