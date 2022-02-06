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

function getCmConfig() {
	var type,
		test,
		value,
		element,
		extend,
		tiddler,
		config = {},
		configTiddlers = $tw.wiki.filterTiddlers(CONFIG_FILTER);

	if ($tw.utils.isArray(configTiddlers)) {
		for (var i=0; i<configTiddlers.length; i++) {
			tiddler = $tw.wiki.getTiddler(configTiddlers[i]);
				if (tiddler) {
				element = configTiddlers[i].replace(/\$:\/config\/codemirror\//ig,"");
					type = (tiddler.fields.type) ? tiddler.fields.type.trim().toLocaleLowerCase() : "string";
				switch (type) {
					case "bool":
					test = tiddler.fields.text.trim().toLowerCase();
					value = (test === "true") ? true : false;
					config[element] = value;
					break;
					case "string":
					value = tiddler.fields.text.trim();
					config[element] = value;
					break;
					case "integer":
					value = parseInt(tiddler.fields.text.trim(), 10);
					config[element] = value;
					break;
					case "json":
					value = JSON.parse(tiddler.fields.text.trim());
						extend = (tiddler.fields.extend) ? tiddler.fields.extend : element;

					if (config[extend]) {
						$tw.utils.extend(config[extend], value);
					} else {
						config[extend] = value;
					}
					break;
				}
			}
		}
	}
	return config;
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
	var config = getCmConfig();

	config.mode = options.type;
	config.value = options.value;
	if(this.widget.editTabIndex) {
		config["tabindex"] = this.widget.editTabIndex;
	}
	config.editWidget = this.widget;
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
		if(self.widget.editInputActions) {
			self.widget.invokeActionString(self.widget.editInputActions,this,event,{actionValue: this.getText()});
		}
	});
	
	this.cm.on("drop",function(cm,event) {
		if(!self.widget.isFileDropEnabled) {
			event.stopPropagation(); // Otherwise TW's dropzone widget sees the drop event
		}
		// Detect if Chrome has added a pseudo File object to the dataTransfer
		if(!$tw.utils.dragEventContainsFiles(event) && event.dataTransfer.files.length) {
			//Make codemirror ignore the event as we will handle the drop ourselves
			event.codemirrorIgnore = true;
			event.preventDefault();

			// from https://github.com/codemirror/CodeMirror/blob/master/src/measurement/position_measurement.js#L673
			function posFromMouse(cm, e, liberal, forRect) {
				let display = cm.display
				if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") return null

				let x, y, space = display.lineSpace.getBoundingClientRect()
				// Fails unpredictably on IE[67] when mouse is dragged around quickly.
				try { x = e.clientX - space.left; y = e.clientY - space.top }
				catch (e) { return null }
				let coords = cm.coordsChar(cm, x, y), line
				if (forRect && coords.xRel > 0 && (line = cm.getLine(cm.doc, coords.line).text).length == coords.ch) {
					let colDiff = window.CodeMirror.countColumn(line, line.length, cm.options.tabSize) - line.length
					coords = window.CodeMirror.Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff))
				}
				return coords
			}

			var pos = posFromMouse(cm,event,true);
			if(!pos || cm.isReadOnly()) {
				return;
			}
			// Don't do a replace if the drop happened inside of the selected text.
			if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
				cm.state.draggingText(event);
				// Ensure the editor is re-focused
				setTimeout(() => cm.display.input.focus(), 20);
				return;
			}
			try {
				var text = event.dataTransfer.getData("Text");
				if (text) {
					var selected;
					if (cm.state.draggingText && !cm.state.draggingText.copy) {
						selected = cm.listSelections();
					}
					cm.setCursor(cm.coordsChar({left:event.pageX,top:event.pageY}));
					if (selected) {
					 	for (var i = 0; i < selected.length; ++i) {
							replaceRange(cm.doc, "", selected[i].anchor, selected[i].head, "drag");
						}
					}
					cm.replaceSelection(text, "around", "paste");
					cm.display.input.focus();
			  }
			}
			catch(e){}
		}
		return false;
	});
	this.cm.on("keydown",function(cm,event) {
		return self.widget.handleKeydownEvent.call(self.widget,event);
	});
	this.cm.on("focus",function(cm,event) {
		if(self.widget.editCancelPopups) {
			$tw.popup.cancel(0);	
		}
	});
	// Add drag and drop event listeners if fileDrop is enabled
	if(this.widget.isFileDropEnabled) {
		// If the drag event contains Files, prevent the default CodeMirror handling
		this.cm.on("dragenter",function(cm,event) {
			if($tw.utils.dragEventContainsFiles(event)) {
				event.preventDefault();
			}
			return true;
		});
		this.cm.on("dragleave",function(cm,event) {
			event.preventDefault();
		});
		this.cm.on("dragover",function(cm,event) {
			if($tw.utils.dragEventContainsFiles(event)) {
				event.preventDefault();
			}
		});
		this.cm.on("drop",function(cm,event) {
			if($tw.utils.dragEventContainsFiles(event)) {
				event.preventDefault();
			}
		});
		this.cm.on("paste",function(cm,event) {
			self.widget.handlePasteEvent.call(self.widget,event);
		});
	}
}

/*
Set the text of the engine if it doesn't currently have focus
*/
CodeMirrorEngine.prototype.setText = function(text,type) {
	var self = this;
	self.cm.setOption("mode",type);
	if(!this.cm.hasFocus()) {
		this.updateDomNodeText(text);
	}
};

/*
Update the DomNode with the new text
*/
CodeMirrorEngine.prototype.updateDomNodeText = function(text) {
	this.cm.setValue(text);
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

exports.CodeMirrorEngine = $tw.browser ? CodeMirrorEngine : require("$:/core/modules/editor/engines/simple.js").SimpleEngine;

})();
