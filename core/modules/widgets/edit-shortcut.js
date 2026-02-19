/*\
title: $:/core/modules/widgets/edit-shortcut.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditShortcutWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

EditShortcutWidget.prototype = new Widget();

EditShortcutWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.inputNode = this.document.createElement("input");
	// Assign classes
	if(this.shortcutClass) {
		this.inputNode.className = this.shortcutClass;
	}

	if(this.shortcutStyle) {
		this.inputNode.setAttribute("style",this.shortcutStyle);
	}
	if(this.shortcutTooltip) {
		this.inputNode.setAttribute("title",this.shortcutTooltip);
	}
	if(this.shortcutPlaceholder) {
		this.inputNode.setAttribute("placeholder",this.shortcutPlaceholder);
	}
	if(this.shortcutAriaLabel) {
		this.inputNode.setAttribute("aria-label",this.shortcutAriaLabel);
	}
	if(this.isDisabled === "yes") {
		this.inputNode.setAttribute("disabled", true);
	}

	this.updateInputNode();
	// Add event handlers
	$tw.utils.addEventListeners(this.inputNode,[
		{name: "keydown", handlerObject: this, handlerMethod: "handleKeydownEvent"}
	]);
	// Link into the DOM
	parent.insertBefore(this.inputNode,nextSibling);
	this.domNodes.push(this.inputNode);
	// Focus the input Node if focus === "yes" or focus === "true"
	if(this.shortcutFocus === "yes" || this.shortcutFocus === "true") {
		this.focus();
	}
};

EditShortcutWidget.prototype.execute = function() {
	this.shortcutTiddler = this.getAttribute("tiddler");
	this.shortcutField = this.getAttribute("field");
	this.shortcutIndex = this.getAttribute("index");
	this.shortcutPlaceholder = this.getAttribute("placeholder");
	this.shortcutDefault = this.getAttribute("default","");
	this.shortcutClass = this.getAttribute("class");
	this.shortcutStyle = this.getAttribute("style");
	this.shortcutTooltip = this.getAttribute("tooltip");
	this.shortcutAriaLabel = this.getAttribute("aria-label");
	this.shortcutFocus = this.getAttribute("focus");
	this.isDisabled = this.getAttribute("disabled", "no");
};

EditShortcutWidget.prototype.updateInputNode = function() {
	if(this.shortcutField) {
		var tiddler = this.wiki.getTiddler(this.shortcutTiddler);
		if(tiddler && $tw.utils.hop(tiddler.fields,this.shortcutField)) {
			this.inputNode.value = tiddler.getFieldString(this.shortcutField);
		} else {
			this.inputNode.value = this.shortcutDefault;
		}
	} else if(this.shortcutIndex) {
		this.inputNode.value = this.wiki.extractTiddlerDataItem(this.shortcutTiddler,this.shortcutIndex,this.shortcutDefault);
	} else {
		this.inputNode.value = this.wiki.getTiddlerText(this.shortcutTiddler,this.shortcutDefault);
	}
};

EditShortcutWidget.prototype.handleKeydownEvent = function(event) {
	// Ignore shift, ctrl, meta, alt
	if(event.keyCode && $tw.keyboardManager.getModifierKeys().indexOf(event.keyCode) === -1) {
		// Get the shortcut text representation
		var value = $tw.keyboardManager.getPrintableShortcuts([{
			ctrlKey: event.ctrlKey,
			shiftKey: event.shiftKey,
			altKey: event.altKey,
			metaKey: event.metaKey,
			keyCode: event.keyCode
		}]);
		if(value.length > 0) {
			this.wiki.setText(this.shortcutTiddler,this.shortcutField,this.shortcutIndex,value[0]);
		}

		event.preventDefault();
		event.stopPropagation();
		return true;
	} else {
		return false;
	}
};

EditShortcutWidget.prototype.focus = function() {
	if(this.inputNode.focus && this.inputNode.select) {
		this.inputNode.focus();
		this.inputNode.select();
	}
};

EditShortcutWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedAttributes.placeholder || changedAttributes["default"] || changedAttributes["class"] || changedAttributes.style || changedAttributes.tooltip || changedAttributes["aria-label"] || changedAttributes.focus || changedAttributes.disabled) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.shortcutTiddler]) {
		this.updateInputNode();
		return true;
	} else {
		return false;
	}
};

exports["edit-shortcut"] = EditShortcutWidget;
