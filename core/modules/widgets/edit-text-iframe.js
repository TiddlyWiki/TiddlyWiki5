/*\
title: $:/core/modules/widgets/edit-text-iframe.js
type: application/javascript
module-type: widget

Edit-text-iframe widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_MIN_TEXT_AREA_HEIGHT = "100px"; // Minimum height of textareas in pixels

// Configuration tiddlers
var HEIGHT_MODE_TITLE = "$:/config/TextEditor/EditorHeight/Mode",
	HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditTextIframeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditTextIframeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditTextIframeWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Get the information about the thing being edited
	var editInfo = this.getEditInfo();
	// Create our hidden dummy text area for reading styles
	this.dummyTextArea = this.document.createElement("textarea");
	if(this.editClass) {
		this.dummyTextArea.className = this.editClass;
	}
	this.dummyTextArea.setAttribute("hidden","true");
	parent.insertBefore(this.dummyTextArea,nextSibling);
	this.domNodes.push(this.dummyTextArea);
	// Create the wrapper for the toolbar and render its content
	this.toolbarNode = this.document.createElement("div");
	this.toolbarNode.className = "tc-edit-text-iframe-toolbar";
	parent.insertBefore(this.toolbarNode,nextSibling);
	this.renderChildren(this.toolbarNode,null);
	this.domNodes.push(this.toolbarNode);
	// Create the iframe
	this.iframeNode = this.document.createElement("iframe");
	parent.insertBefore(this.iframeNode,nextSibling);
	var iframeDoc = this.iframeNode.contentWindow.document;
	// (Firefox requires us to put some empty content in the iframe)
	iframeDoc.open();
	iframeDoc.write("");
	iframeDoc.close();
	// Style the iframe
	this.iframeNode.className = this.dummyTextArea.className;
	this.iframeNode.style.border = "none";
	iframeDoc.body.style.margin = "0";
	iframeDoc.body.style.padding = "0";
	this.iframeNode.style.resize = "none";
	this.domNodes.push(this.iframeNode);
	// Create the textarea
	this.iframeTextArea = iframeDoc.createElement("textarea");
	if(editInfo.value === "" && this.editPlaceholder) {
		this.iframeTextArea.setAttribute("placeholder",this.editPlaceholder);
	}
	if(this.editSize) {
		this.iframeTextArea.setAttribute("size",this.editSize);
	}
	if(this.editRows) {
		this.iframeTextArea.setAttribute("rows",this.editRows);
	}
	// Copy the styles from the dummy textarea
	var textAreaStyles = window.getComputedStyle(this.dummyTextArea,null),
		styleText = [];
	$tw.utils.each(textAreaStyles,function(name,index) {
		styleText.push(name + ": " + textAreaStyles[name] + ";");
	});
	this.iframeTextArea.style.cssText = styleText.join("");
	this.iframeTextArea.style.display = "block";
	this.iframeTextArea.style.width = "100%";
	// Add event listeners for the textarea
	$tw.utils.addEventListeners(this.iframeTextArea,[
		{name: "keydown", handlerObject: this, handlerMethod: "handleKeydownEvent"},
		{name: "input", handlerObject: this, handlerMethod: "handleInputEvent"}
	]);
	// Put the text in the textarea, and insert it into the DOM
	this.iframeTextArea.appendChild(iframeDoc.createTextNode(editInfo.value));
	iframeDoc.body.appendChild(this.iframeTextArea);
	// Call the post-render hook if present
	if(this.postRender) {
		this.postRender();
	}
	// Fix height
	this.fixHeight();
	// Focus field
	if(this.editFocus === "true") {
		if(this.iframeTextArea.focus && this.iframeTextArea.select) {
			this.iframeTextArea.focus();
			this.iframeTextArea.select();
		}
	}
	// Add widget message listeners
	this.addEventListeners([
		{type: "tm-edit-text-operation", handler: "handleEditTextOperationMessage"}
	]);
};

/*
Handle an edit text operation message from the toolbar
*/
EditTextIframeWidget.prototype.handleEditTextOperationMessage = function(event) {
	// Get the current text
	var text = this.iframeTextArea.value,
		selStart = this.iframeTextArea.selectionStart,
		selEnd = this.iframeTextArea.selectionEnd,
		selection = text.substring(selStart,selEnd),
		cutStart,
		cutEnd,
		replacement,
		newSelStart,
		newSelEnd;
	// Perform the required action
	switch(event.param) {
		case "prefix-lines":
			// Cut just past the preceding line break, or the start of the text
			cutStart = this.findPrecedingLineBreak(text,selStart);
			// Cut to just past the following line break, or to the end of the text
			cutEnd = this.findFollowingLineBreak(text,selEnd);
			// Process each line
			var lines = text.substring(cutStart,cutEnd).split(/\r?\n/mg);
			$tw.utils.each(lines,function(line,index) {
				// Compose the required prefix
				var prefix = event.paramObject.character.repeat(event.paramObject.count);
				// Check if we already have the required prefix
				if(line.substring(0,prefix.length) === prefix) {
					// If so, remove the prefix
					line = line.substring(prefix.length);
					// Remove any whitespace
					while(line.charAt(0) === " ") {
						line = line.substring(1);
					}
				} else {
					// If we didn't have the prefix, remove any existing prefix characters
					while(line.charAt(0) === event.paramObject.character) {
						line = line.substring(1);
					}
					// Remove any whitespace
					while(line.charAt(0) === " ") {
						line = line.substring(1);
					}
					// Apply the prefix
					line =  prefix + " " + line;
				}
				// Save the modified line
				lines[index] = line;
			});
			// Stitch the replacement text together and set the selection
			replacement = lines.join("\n");
			if(lines.length === 1) {
				newSelStart = cutStart + replacement.length;
				newSelEnd = newSelStart;
			} else {
				newSelStart = cutStart;
				newSelEnd = newSelStart + replacement.length;
			}
			break;
		case "replace-all":
			cutStart = 0;
			cutEnd = text.length;
			replacement = event.paramObject.text;
			newSelStart = 0;
			newSelEnd = replacement.length;
			break;
		case "wrap-selection":
			if(selStart === selEnd) {
				// No selection; check if we're within the prefix/suffix
				if(text.substring(selStart - event.paramObject.prefix.length,selStart + event.paramObject.suffix.length) === event.paramObject.prefix + event.paramObject.suffix) {
					// Remove the prefix and suffix unless they comprise the entire text
					if(selStart > event.paramObject.prefix.length || (selEnd + event.paramObject.suffix.length) < text.length ) {
						cutStart = selStart - event.paramObject.prefix.length;
						cutEnd = selEnd + event.paramObject.suffix.length;
						replacement = "";
						newSelStart = cutStart;
						newSelEnd = newSelStart;
					}
				} else {
					// Wrap the cursor instead
					cutStart = selStart;
					cutEnd = selEnd;
					replacement = event.paramObject.prefix + event.paramObject.suffix;
					newSelStart = selStart + event.paramObject.prefix.length;
					newSelEnd = newSelStart;
				}
			} else if(text.substring(selStart,selStart + event.paramObject.prefix.length) === event.paramObject.prefix && text.substring(selEnd - event.paramObject.suffix.length,selEnd) === event.paramObject.suffix) {
				// Prefix and suffix are already present, so remove them
				cutStart = selStart;
				cutEnd = selEnd;
				replacement = selection.substring(event.paramObject.prefix.length,selection.length - event.paramObject.suffix.length);
				newSelStart = selStart;
				newSelEnd = selStart + replacement.length;
			} else {
				// Add the prefix and suffix
				cutStart = selStart;
				cutEnd = selEnd;
				replacement = event.paramObject.prefix + selection + event.paramObject.suffix;
				newSelStart = selStart;
				newSelEnd = selStart + replacement.length;
			}
			break;
		case "wrap-lines":
			// Cut just past the preceding line break, or the start of the text
			cutStart = this.findPrecedingLineBreak(text,selStart);
			// Cut to just past the following line break, or to the end of the text
			cutEnd = this.findFollowingLineBreak(text,selEnd);
			// Add the prefix and suffix
			replacement = event.paramObject.prefix + "\n" +
						text.substring(cutStart,cutEnd) + "\n" +
						event.paramObject.suffix + "\n";
			newSelStart = cutStart + event.paramObject.prefix.length + 1;
			newSelEnd = newSelStart + (cutEnd - cutStart);
			break;
		case "replace-selection":
			replacement = event.paramObject.text;
			cutStart = selStart;
			cutEnd = selEnd;
			newSelStart = selStart;
			newSelEnd = selStart + replacement.length;
			break;
		case "excise":
			var editTiddler = this.wiki.getTiddler(this.editTitle),
				editTiddlerTitle = this.editTitle;
			if(editTiddler && editTiddler.fields["draft.of"]) {
				editTiddlerTitle = editTiddler.fields["draft.of"];
			}
			var excisionTitle = event.paramObject.title || "New Excision";
			this.wiki.addTiddler(new $tw.Tiddler(
				this.wiki.getCreationFields(),
				this.wiki.getModificationFields(),
				{
					title: excisionTitle,
					text: selection,
					tags: event.paramObject.tagnew === "yes" ?  [editTiddlerTitle] : []
				}
			));
			replacement = excisionTitle;
			switch(event.paramObject.type || "transclude") {
				case "transclude":
					replacement = "{{" + replacement+ "}}";
					break;
				case "link":
					replacement = "[[" + replacement+ "]]";
					break;
				case "macro":
					replacement = "<<" + (event.paramObject.macro || "translink") + " \"\"\"" + replacement + "\"\"\">>";
					break;
			}
			cutStart = selStart;
			cutEnd = selEnd;
			newSelStart = selStart;
			newSelEnd = selStart + replacement.length;
			break;
		case "undo":
			this.iframeNode.focus();
			this.iframeTextArea.focus();
			this.document.execCommand("undo", false, null);
			break;
		case "redo":
			this.iframeNode.focus();
			this.iframeTextArea.focus();
			this.document.execCommand("redo", false, null);
			break;
	}
	// Perform the required changes to the text area and the underlying tiddler
	if(replacement !== undefined) {
		// Work around the problem that textInput can't be used directly to delete text without also replacing it with a non-zero length string
		if(replacement === "") {
			replacement = text.substring(0,cutStart) + text.substring(cutEnd)
			cutStart = 0;
			cutEnd = text.length;
		}
		var newText = text.substring(0,cutStart) + replacement + text.substring(cutEnd),
			textEvent = this.document.createEvent("TextEvent");
		if(textEvent.initTextEvent) {
			textEvent.initTextEvent("textInput", true, true, null, replacement, 9, "en-US");
			this.iframeTextArea.focus();
			this.iframeTextArea.setSelectionRange(cutStart,cutEnd);
			this.iframeTextArea.dispatchEvent(textEvent);
		} else {
			this.iframeTextArea.value = newText;
		}
		this.iframeNode.focus();
		this.iframeTextArea.setSelectionRange(newSelStart,newSelEnd);
	}
	this.iframeTextArea.focus();
	this.fixHeight();
	this.saveChanges(newText);
};

/*
Helper to find the line break preceding a given position in a string
Returns position immediately after that line break, or the start of the string
*/
EditTextIframeWidget.prototype.findPrecedingLineBreak = function(text,pos) {
	var result = text.lastIndexOf("\n",pos - 1);
	if(result === -1) {
		result = 0;
	} else {
		result++;
		if(text.charAt(result) === "\r") {
			result++;
		}
	}
	return result;
};

/*
Helper to find the line break following a given position in a string
*/
EditTextIframeWidget.prototype.findFollowingLineBreak = function(text,pos) {
	// Cut to just past the following line break, or to the end of the text
	var result = text.indexOf("\n",pos);
	if(result === -1) {
		result = text.length;
	} else {
		if(text.charAt(result) === "\r") {
			result++;
		}
	}
	return result;
};

/*
Get the tiddler being edited and current value
*/
EditTextIframeWidget.prototype.getEditInfo = function() {
	// Get the edit value
	var self = this,
		value,
		update;
	if(this.editIndex) {
		value = this.wiki.extractTiddlerDataItem(this.editTitle,this.editIndex,this.editDefault);
		update = function(value) {
			var data = self.wiki.getTiddlerData(self.editTitle,{});
			if(data[self.editIndex] !== value) {
				data[self.editIndex] = value;
				self.wiki.setTiddlerData(self.editTitle,data);
			}
		};
	} else {
		// Get the current tiddler and the field name
		var tiddler = this.wiki.getTiddler(this.editTitle);
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
			if(this.editDefault !== undefined) {
				value = this.editDefault;
			}
		}
		update = function(value) {
			var tiddler = self.wiki.getTiddler(self.editTitle),
				updateFields = {
					title: self.editTitle
				};
			updateFields[self.editField] = value;
			self.wiki.addTiddler(new $tw.Tiddler(self.wiki.getCreationFields(),tiddler,updateFields,self.wiki.getModificationFields()));
		};
	}
	return {value: value, update: update};
};

/*
Compute the internal state of the widget
*/
EditTextIframeWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.editField = this.getAttribute("field","text");
	this.editIndex = this.getAttribute("index");
	this.editDefault = this.getAttribute("default");
	this.editClass = this.getAttribute("class");
	this.editPlaceholder = this.getAttribute("placeholder");
	this.editSize = this.getAttribute("size");
	this.editRows = this.getAttribute("rows");
	this.editAutoHeight = this.wiki.getTiddlerText(HEIGHT_MODE_TITLE,"auto");
	this.editAutoHeight = this.getAttribute("autoHeight",this.editAutoHeight === "auto" ? "yes" : "no") === "yes";
	this.editMinHeight = this.getAttribute("minHeight",DEFAULT_MIN_TEXT_AREA_HEIGHT);
	this.editFocus = this.getAttribute("focus");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EditTextIframeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedAttributes["default"] || changedAttributes["class"] || changedAttributes.placeholder || changedAttributes.size || changedAttributes.autoHeight || changedAttributes.minHeight || changedAttributes.focusPopup ||  changedAttributes.rows || changedTiddlers[HEIGHT_MODE_TITLE]) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.editTitle]) {
		this.updateEditor(this.getEditInfo().value);
		this.fixHeight();
		return this.refreshChildren(changedTiddlers);
	} else {
		// Fix the height anyway in case there has been a reflow
		this.fixHeight();
		return this.refreshChildren(changedTiddlers);
	}
};

/*
Update the editor with new text. This method is separate from updateEditorDomNode()
so that subclasses can override updateEditor() and still use updateEditorDomNode()
*/
EditTextIframeWidget.prototype.updateEditor = function(text) {
	this.updateEditorDomNode(text);
};

/*
Update the editor dom node with new text
*/
EditTextIframeWidget.prototype.updateEditorDomNode = function(text) {
	// Replace the edit value if the tiddler we're editing has changed
	if(!this.iframeTextArea.isTiddlyWikiFakeDom) {
		if(this.document.activeElement !== this.iframeNode) {
			this.iframeTextArea.value = text;
		}
		// Fix the height if needed
		this.fixHeight();
	}
};

/*
Get the first parent element that has scrollbars or use the body as fallback.
*/
EditTextIframeWidget.prototype.getScrollContainer = function(el) {
	while(el.parentNode) {	
		el = el.parentNode;
		if(el.scrollTop) {
			return el;
		}
	}
	return this.document.body;
};

/*
Fix the height of textareas to fit their content
*/
EditTextIframeWidget.prototype.fixHeight = function() {
	if(this.editAutoHeight) {
		if(this.iframeNode && !this.iframeNode.isTiddlyWikiFakeDom) {
			// Resize the textarea to fit its content, preserving scroll position
			// Get the scroll container and register the current scroll position
			var container = this.getScrollContainer(this.iframeNode),
				scrollTop = container.scrollTop;
			// Measure the specified minimum height
			this.iframeTextArea.style.height = this.editMinHeight;
			var minHeight = this.iframeTextArea.offsetHeight;
			// Set its height to auto so that it snaps to the correct height
			this.iframeTextArea.style.height = "auto";
			// Calculate the revised height
			var newHeight = Math.max(this.iframeTextArea.scrollHeight + this.iframeTextArea.offsetHeight - this.iframeTextArea.clientHeight,minHeight);
			// Only try to change the height if it has changed
			if(newHeight !== this.iframeNode.offsetHeight) {
				this.iframeNode.style.height = (newHeight + 14) + "px"; // +8 for the border on the textarea
				this.iframeTextArea.style.height = newHeight + "px";
				// Set the container to the position we registered at the beginning
				container.scrollTop = scrollTop;
			}
		}
	} else {
		var fixedHeight = parseInt(this.wiki.getTiddlerText(HEIGHT_VALUE_TITLE,"400px"),10);
		fixedHeight = Math.max(fixedHeight,20)
		this.iframeTextArea.style.height = fixedHeight + "px";
		this.iframeNode.style.height = (fixedHeight + 14) + "px";
	}
};

/*
Handle a dom "input" event
*/
EditTextIframeWidget.prototype.handleInputEvent = function(event) {
	this.saveChanges(this.iframeTextArea.value);
	this.fixHeight();
	return true;
};

/*
Handle a dom "keydown" event, which we'll bubble up to our container for the keyboard widgets benefit
*/
EditTextIframeWidget.prototype.handleKeydownEvent = function(event) {
	var newEvent = this.document.createEventObject ? this.document.createEventObject() : this.document.createEvent("Events");
	if(newEvent.initEvent) {
		newEvent.initEvent("keydown", true, true);
	}
	newEvent.keyCode = event.keyCode;
	newEvent.which = event.which;
	newEvent.metaKey = event.metaKey;
	newEvent.ctrlKey = event.ctrlKey;
	newEvent.altKey = event.altKey;
	newEvent.shiftKey = event.shiftKey;
	if(!this.parentDomNode.dispatchEvent(newEvent)) {
		event.preventDefault();
		event.stopPropagation();
		return true;
	}
	return false;
};

/*
Forward a dom "keydown" event from the iframe to the parent of the widget
*/
EditTextIframeWidget.prototype.forwardKeydownEvent = function(event) {
};

EditTextIframeWidget.prototype.saveChanges = function(text) {
	var editInfo = this.getEditInfo();
	if(text !== editInfo.value) {
		editInfo.update(text);
	}
};

exports["edit-text-iframe"] = EditTextIframeWidget;

})();
