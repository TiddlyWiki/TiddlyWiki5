/*\
title: $:/core/modules/new_widgets/edit-text.js
type: application/javascript
module-type: new_widget

Edit-text widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MIN_TEXT_AREA_HEIGHT = 100; // Minimum height of textareas in pixels

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var EditTextWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditTextWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditTextWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our element
	var domNode = this.document.createElement(this.editTag);
	if(this.editType) {
		domNode.setAttribute("type",this.editType);
	}
	// Assign classes
	domNode.className = this.editClass;
	// Set the text
	var editInfo = this.getEditInfo();
	if(this.editTag === "textarea") {
		domNode.appendChild(this.document.createTextNode(editInfo.value));
	} else {
		domNode.setAttribute("value",editInfo.value)
	}
	// Add an input event handler
	domNode.addEventListener("input",function (event) {
		return self.handleInputEvent(event);
	},false);
	// Insert the element into the DOM
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	// Fix height
	this.fixHeight();
};

/*
Get the tiddler being edited and current value
*/
EditTextWidget.prototype.getEditInfo = function() {
	// Get the edit value
	var tiddler = this.wiki.getTiddler(this.editTitle),
		value;
	if(this.editIndex) {
		value = this.wiki.extractTiddlerDataItem(this.editTitle,this.editIndex,this.editDefault);
	} else {
		// Get the current tiddler and the field name
		if(tiddler) {
			// If we've got a tiddler, the value to display is the field string value
			value = tiddler.getFieldString(this.editField);
		} else {
			// Otherwise, we need to construct a default value for the editor
			switch(this.editField) {
				case "text":
					value = "Type the text for the tiddler '" + this.editTitle + "'";
					break;
				case "title":
					value = this.editTitle;
					break;
				default:
					value = "";
					break;
			}
			value = this.editDefault;
		}
	}
	return {tiddler: tiddler, value: value};
};

/*
Compute the internal state of the widget
*/
EditTextWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("title",this.getVariable("tiddlerTitle"));
	this.editField = this.getAttribute("field","text");
	this.editIndex = this.getAttribute("index");
	this.editDefault = this.getAttribute("default","");
	this.editClass = this.getAttribute("class");
	// Get the editor element tag and type
	var tag,type;
	if(this.editField === "text") {
		tag = "textarea";
	} else {
		tag = "input";
		var fieldModule = $tw.Tiddler.fieldModules[this.editField];
		if(fieldModule && fieldModule.editType) {
			type = fieldModule.editType;
		}
		type = type || "text";
	}
	// Get the rest of our parameters
	this.editTag = this.getAttribute("tag",tag);
	this.editType = this.getAttribute("type",type);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EditTextWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.editTitle]){
		// Replace the edit value if the tiddler we're editing has changed
		var domNode = this.domNodes[0];
		if(!domNode.isTiddlyWikiFakeDom) {
			if(this.document.activeElement !== domNode) {
				var editInfo = this.getEditInfo();
				domNode.value = editInfo.value;
			}
			// Fix the height if needed
			this.fixHeight();
		}
	}
	return false;
};

/*
Fix the height of textareas to fit their content
*/
EditTextWidget.prototype.fixHeight = function() {
	var self = this,
		domNode = this.domNodes[0];
	if(domNode && !domNode.isTiddlyWikiFakeDom && this.editTag === "textarea") {
		$tw.utils.nextTick(function() {
			// Resize the textarea to fit its content, preserving scroll position
			var scrollPosition = $tw.utils.getScrollPosition(),
				scrollTop = scrollPosition.y;
			// Set its height to auto so that it snaps to the correct height
			domNode.style.height = "auto";
			// Calculate the revised height
			var newHeight = Math.max(domNode.scrollHeight + domNode.offsetHeight - domNode.clientHeight,MIN_TEXT_AREA_HEIGHT);
			// Only try to change the height if it has changed
			if(newHeight !== domNode.offsetHeight) {
				domNode.style.height =  newHeight + "px";
				// Make sure that the dimensions of the textarea are recalculated
				$tw.utils.forceLayout(domNode);
				// Check that the scroll position is still visible before trying to scroll back to it
				scrollTop = Math.min(scrollTop,self.document.body.scrollHeight - window.innerHeight);
				window.scrollTo(scrollPosition.x,scrollTop);
			}
		});
	}
};

/*
Handle a dom "input" event
*/
EditTextWidget.prototype.handleInputEvent = function(event) {
	this.saveChanges();
	this.fixHeight();
	return true;
};

EditTextWidget.prototype.saveChanges = function() {
	var text = this.domNodes[0].value
	if(this.editField) {
		var tiddler = this.wiki.getTiddler(this.editTitle);
		if(!tiddler) {
			tiddler = new $tw.Tiddler({title: this.editTitle});
		}
		var oldValue = tiddler.getFieldString(this.editField);
		if(text !== oldValue) {
			var update = {};
			update[this.editField] = text;
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
		}
	} else {
		var data = this.wiki.getTiddlerData(this.editTitle,{});
		if(data[this.editIndex] !== text) {
			data[this.editIndex] = text;
			this.wiki.setTiddlerData(this.editTitle,data);
		}
	}
};

/*
Remove any DOM nodes created by this widget or its children
*/
EditTextWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports["edit-text"] = EditTextWidget;

})();
