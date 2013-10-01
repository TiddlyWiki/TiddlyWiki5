/*\
title: $:/core/modules/widgets/edit/editors/texteditor.js
type: application/javascript
module-type: editor

A plain text editor

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MIN_TEXT_AREA_HEIGHT = 100;

var TextEditor = function(editWidget,tiddlerTitle,fieldName,indexName) {
	this.editWidget = editWidget;
	this.tiddlerTitle = tiddlerTitle;
	this.fieldName = fieldName;
	this.indexName = indexName;
};

/*
Get the tiddler being edited and current value
*/
TextEditor.prototype.getEditInfo = function() {
	var tiddler = this.editWidget.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		value;
	if(this.fieldName) {
		// Get the current tiddler and the field name
		if(tiddler) {
			// If we've got a tiddler, the value to display is the field string value
			value = tiddler.getFieldString(this.fieldName);
		} else {
			// Otherwise, we need to construct a default value for the editor
			switch(this.fieldName) {
				case "text":
					value = "Type the text for the tiddler '" + this.tiddlerTitle + "'";
					break;
				case "title":
					value = this.tiddlerTitle;
					break;
				default:
					value = "";
					break;
			}
			value = this.editWidget.renderer.getAttribute("default",value);
		}
	} else {
		value = this.editWidget.renderer.renderTree.wiki.extractTiddlerDataItem(this.tiddlerTitle,this.indexName,this.editWidget.renderer.getAttribute("default"));
	}
	return {tiddler: tiddler, value: value};
};

TextEditor.prototype.render = function() {
	// Get the initial value of the editor
	var editInfo = this.getEditInfo();
	// Create the editor nodes
	var node = {
		type: "element",
		attributes: {}
	};
	// Get the edit type associated with this field
	var type = "input";
	if(this.fieldName === "text") {
		type = "textarea";
	} else {
		var fieldModule = $tw.Tiddler.fieldModules[this.fieldName];
		if(fieldModule && fieldModule.editType) {
			type = fieldModule.editType;
		}
	}
	var type = this.editWidget.renderer.getAttribute("type",type);
	switch(type) {
		case "textarea":
			node.tag = "textarea";
			node.children = [{
				type: "text",
				text: editInfo.value
			}];
			break;
		case "color":
			node.tag = "input";
			node.attributes.type = {type: "string", value: "color"};
			node.attributes.value = {type: "string", value: editInfo.value};
			break;
		case "search":
			node.tag = "input";
			node.attributes.type = {type: "string", value: "search"};
			node.attributes.value = {type: "string", value: editInfo.value};
			break;
		default: // "input"
			node.tag = "input";
			node.attributes.type = {type: "string", value: "text"};
			node.attributes.value = {type: "string", value: editInfo.value};
			break;
	}
	node.events = [
		{name: "focus", handlerObject: this, handlerMethod: "handleFocusEvent"},
		{name: "blur", handlerObject: this, handlerMethod: "handleBlurEvent"},
		{name: "input", handlerObject: this, handlerMethod: "handleInputEvent"}
	];
	// Add a placeholder if specified
	if(this.editWidget.renderer.hasAttribute("placeholder")) {
		node.attributes.placeholder = {type: "string", value: this.editWidget.renderer.getAttribute("placeholder")};
	}
	// Set the element details
	this.editWidget.tag = this.editWidget.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.editWidget.attributes = {
		"class": "tw-edit-texteditor"
	};
	if(this.editWidget.renderer.hasAttribute("class")) {
		this.editWidget.attributes["class"] += " " + this.editWidget.renderer.getAttribute("class");
	}
	if(this.editWidget.renderer.hasAttribute("style")) {
		this.editWidget.attributes.style = this.editWidget.attributes.style || "";
		this.editWidget.attributes.style += this.editWidget.renderer.getAttribute("style");
	}
	this.editWidget.children = this.editWidget.renderer.renderTree.createRenderers(this.editWidget.renderer,[node]);
};

TextEditor.prototype.setFocus = function() {
	if(this.editWidget.renderer.hasAttribute("focusSet")) {
		var title = this.editWidget.renderer.getAttribute("focusSet");
		if(this.editWidget.renderer.getAttribute("qualifyTiddlerTitles") === "yes") {
			title =  title + "-" + this.editWidget.renderer.renderTree.getContextScopeId(this.editWidget.renderer.parentRenderer);
		}
		$tw.popup.triggerPopup({
			domNode: this.editWidget.renderer.domNode,
			title: title,
			wiki: this.editWidget.renderer.renderTree.wiki,
			force: true
		});
	}
};

TextEditor.prototype.handleFocusEvent = function(event) {
//	this.saveChanges();
//	this.fixHeight();
	this.setFocus();
	return true;
};

TextEditor.prototype.handleBlurEvent = function(event) {
//	this.saveChanges();
	return true;
};

TextEditor.prototype.handleInputEvent = function(event) {
	this.saveChanges();
	this.fixHeight();
	return true;
};

TextEditor.prototype.saveChanges = function() {
	var text = this.editWidget.children[0].domNode.value
	if(this.fieldName) {
		var tiddler = this.editWidget.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
		if(!tiddler) {
			tiddler = new $tw.Tiddler({title: this.tiddlerTitle});
		}
		var oldValue = tiddler.getFieldString(this.fieldName);
		if(text !== oldValue) {
			var update = {};
			update[this.fieldName] = text;
			this.editWidget.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
		}
	} else {
		var data = this.editWidget.renderer.renderTree.wiki.getTiddlerData(this.tiddlerTitle,{});
		if(data[this.indexName] !== text) {
			data[this.indexName] = text;
			this.editWidget.renderer.renderTree.wiki.setTiddlerData(this.tiddlerTitle,data);
		}
	}
};

TextEditor.prototype.fixHeight = function() {
	var self = this;
	if(this.editWidget.children[0].domNode && this.editWidget.children[0].domNode.type === "textarea") {
		$tw.utils.nextTick(function() {
			// Resize the textarea to fit its content
			var textarea = self.editWidget.children[0].domNode,
				scrollPosition = $tw.utils.getScrollPosition(),
				scrollTop = scrollPosition.y;
			// Set its height to auto so that it snaps to the correct height
			textarea.style.height = "auto";
			// Calculate the revised height
			var newHeight = Math.max(textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight,MIN_TEXT_AREA_HEIGHT);
			// Only try to change the height if it has changed
			if(newHeight !== textarea.offsetHeight) {
				textarea.style.height =  newHeight + "px";
				// Make sure that the dimensions of the textarea are recalculated
				$tw.utils.forceLayout(textarea);
				// Check that the scroll position is still visible before trying to scroll back to it
				scrollTop = Math.min(scrollTop,self.editWidget.renderer.renderTree.document.body.scrollHeight - window.innerHeight);
				window.scrollTo(scrollPosition.x,scrollTop);
			}
		});
	}
};

TextEditor.prototype.postRenderInDom = function() {
	this.fixHeight();
};

TextEditor.prototype.refreshInDom = function() {
	if(this.editWidget.renderer.renderTree.document.activeElement !== this.editWidget.children[0].domNode) {
		var editInfo = this.getEditInfo();
		this.editWidget.children[0].domNode.value = editInfo.value;
	}
	// Fix the height if needed
	this.fixHeight();
};

exports["text/vnd.tiddlywiki"] = TextEditor;
exports["text/plain"] = TextEditor;

})();
