/*\
title: $:/core/modules/editor/factory.js
type: application/javascript
module-type: library
\*/

"use strict";

var DEFAULT_MIN_TEXT_AREA_HEIGHT = "100px"; // Minimum height of textareas in pixels

var HEIGHT_MODE_TITLE = "$:/config/TextEditor/EditorHeight/Mode";
var ENABLE_TOOLBAR_TITLE = "$:/config/TextEditor/EnableToolbar";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

function editTextWidgetFactory(toolbarEngine,nonToolbarEngine) {

	var EditTextWidget = function(parseTreeNode,options) {
		// Initialise the editor operations if they've not been done already
		if(!this.editorOperations) {
			EditTextWidget.prototype.editorOperations = {};
			$tw.modules.applyMethods("texteditoroperation",this.editorOperations);
		}
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
		// Save the parent dom node
		this.parentDomNode = parent;
		// Compute our attributes
		this.computeAttributes();
		// Execute our logic
		this.execute();
		// Create the wrapper for the toolbar and render its content
		if(this.editShowToolbar) {
			this.toolbarNode = this.document.createElement("div");
			this.toolbarNode.className = "tc-editor-toolbar";
			parent.insertBefore(this.toolbarNode,nextSibling);
			this.domNodes.push(this.toolbarNode);
			this.renderChildren(this.toolbarNode,null);
		}
		// Create our element
		var editInfo = this.getEditInfo(),
			Engine = this.editShowToolbar ? toolbarEngine : nonToolbarEngine;
		this.engine = new Engine({
				widget: this,
				value: editInfo.value,
				type: editInfo.type,
				parentNode: parent,
				nextSibling: nextSibling
			});
		// Call the postRender hook
		if(this.postRender) {
			this.postRender();
		}
		// Fix height
		this.engine.fixHeight();
		// Focus if required
		if($tw.browser && (this.editFocus === "true" || this.editFocus === "yes") && !$tw.utils.hasClass(this.parentDomNode.ownerDocument.activeElement,"tc-keep-focus")) {
			this.engine.focus();
		}
		// Add widget message listeners
		this.addEventListeners([
			{type: "tm-edit-text-operation", handler: "handleEditTextOperationMessage"}
		]);
	};

	/*
	Get the tiddler being edited and current value
	*/
	EditTextWidget.prototype.getEditInfo = function() {
		// Get the edit value
		var self = this,
			value,
			type = "text/plain",
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
				if(tiddler.hasField(this.editField)) {
					value = tiddler.getFieldString(this.editField);
				} else {
					value = this.editDefault || "";
				}
				if(this.editField === "text") {
					type = tiddler.fields.type || "text/vnd.tiddlywiki";
				}
			} else {
				// Otherwise, we need to construct a default value for the editor
				switch(this.editField) {
					case "text":
						value = "";
						type = "text/vnd.tiddlywiki";
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
		if(this.editType) {
			type = this.editType;
		}
		return {value: value || "", type: type, update: update};
	};

	EditTextWidget.prototype.handleEditTextOperationMessage = function(event) {
		// Prepare information about the operation
		var operation = this.engine.createTextOperation();
		// Invoke the handler for the selected operation
		var handler = this.editorOperations[event.param];
		if(handler) {
			handler.call(this,event,operation);
		}

		var newText = this.engine.executeTextOperation(operation);
		// Fix the tiddler height and save changes
		this.engine.fixHeight();
		this.saveChanges(newText);
	};

	EditTextWidget.prototype.execute = function() {
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
		this.editFocusPopup = this.getAttribute("focusPopup");
		this.editFocus = this.getAttribute("focus");
		this.editFocusSelectFromStart = $tw.utils.parseNumber(this.getAttribute("focusSelectFromStart","0"));
		this.editFocusSelectFromEnd = $tw.utils.parseNumber(this.getAttribute("focusSelectFromEnd","0"));
		this.editTabIndex = this.getAttribute("tabindex");
		this.editCancelPopups = this.getAttribute("cancelPopups","") === "yes";
		this.editInputActions = this.getAttribute("inputActions");
		this.editRefreshTitle = this.getAttribute("refreshTitle");
		this.editAutoComplete = this.getAttribute("autocomplete");
		this.isDisabled = this.getAttribute("disabled","no");
		this.isFileDropEnabled = this.getAttribute("fileDrop","no") === "yes";
		// Get the default editor element tag and type
		var tag,type;
		if(this.editField === "text") {
			tag = "textarea";
		} else {
			tag = "input";
			var fieldModule = $tw.Tiddler.fieldModules[this.editField];
			if(fieldModule && fieldModule.editTag) {
				tag = fieldModule.editTag;
			}
			if(fieldModule && fieldModule.editType) {
				type = fieldModule.editType;
			}
			type = type || "text";
		}

		this.editTag = this.getAttribute("tag",tag) || "input";
		this.editType = this.getAttribute("type",type);
		// Make the child widgets
		this.makeChildWidgets();
		// Determine whether to show the toolbar
		this.editShowToolbar = this.wiki.getTiddlerText(ENABLE_TOOLBAR_TITLE,"yes");
		this.editShowToolbar = (this.editShowToolbar === "yes") && !!(this.children && this.children.length > 0) && (!this.document.isTiddlyWikiFakeDom);
	};

	EditTextWidget.prototype.refresh = function(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		// Completely rerender if any of our attributes have changed
		if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedAttributes["default"] || changedAttributes["class"] || changedAttributes.placeholder || changedAttributes.size || changedAttributes.autoHeight || changedAttributes.minHeight || changedAttributes.focusPopup ||  changedAttributes.rows || changedAttributes.tabindex || changedAttributes.cancelPopups || changedAttributes.inputActions || changedAttributes.refreshTitle || changedAttributes.autocomplete || changedTiddlers[HEIGHT_MODE_TITLE] || changedTiddlers[ENABLE_TOOLBAR_TITLE] || changedTiddlers["$:/palette"] || changedAttributes.disabled || changedAttributes.fileDrop) {
			this.refreshSelf();
			return true;
		} else if (changedTiddlers[this.editRefreshTitle]) {
			this.engine.updateDomNodeText(this.getEditInfo().value);
		} else if(changedTiddlers[this.editTitle]) {
			var editInfo = this.getEditInfo();
			this.updateEditor(editInfo.value,editInfo.type);
		}
		this.engine.fixHeight();
		if(this.editShowToolbar) {
			return this.refreshChildren(changedTiddlers);
		} else {
			return false;
		}
	};

	EditTextWidget.prototype.updateEditor = function(text,type) {
		this.updateEditorDomNode(text,type);
	};

	EditTextWidget.prototype.updateEditorDomNode = function(text,type) {
		this.engine.setText(text,type);
	};

	EditTextWidget.prototype.saveChanges = function(text) {
		var editInfo = this.getEditInfo();
		if(text !== editInfo.value) {
			editInfo.update(text);
		}
	};

	EditTextWidget.prototype.handleKeydownEvent = function(event) {
		// Check for a keyboard shortcut
		if(this.toolbarNode) {
			var shortcutElements = this.toolbarNode.querySelectorAll("[data-tw-keyboard-shortcut]");
			for(var index=0; index<shortcutElements.length; index++) {
				var el = shortcutElements[index],
					shortcutData = el.getAttribute("data-tw-keyboard-shortcut"),
					keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(shortcutData,{
						wiki: this.wiki
					});
				if($tw.keyboardManager.checkKeyDescriptors(event,keyInfoArray)) {
					var clickEvent = this.document.createEvent("Events");
				    clickEvent.initEvent("click",true,false);
				    el.dispatchEvent(clickEvent);
					event.preventDefault();
					event.stopPropagation();
					return true;
				}
			}
		}

		if(this.propogateKeydownEvent(event)) {
			// Ignore the keydown if it was already handled
			event.preventDefault();
			event.stopPropagation();
			return true;
		}

		return false;
	};

	EditTextWidget.prototype.propogateKeydownEvent = function(event) {
		var newEvent = this.cloneEvent(event,["keyCode","code","which","key","metaKey","ctrlKey","altKey","shiftKey"]);
		return !this.parentDomNode.dispatchEvent(newEvent);
	};

	EditTextWidget.prototype.cloneEvent = function(event,propertiesToCopy) {
		var propertiesToCopy = propertiesToCopy || [],
			newEvent = this.document.createEventObject ? this.document.createEventObject() : this.document.createEvent("Events");
		if(newEvent.initEvent) {
			newEvent.initEvent(event.type, true, true);
		}
		$tw.utils.each(propertiesToCopy,function(prop){
			newEvent[prop] = event[prop];
		});
		return newEvent;
	};

	EditTextWidget.prototype.dispatchDOMEvent = function(newEvent) {
		var dispatchNode = this.engine.iframeNode || this.engine.parentNode;
		return dispatchNode.dispatchEvent(newEvent);
	};

	EditTextWidget.prototype.handleDropEvent = function(event) {
		if($tw.utils.dragEventContainsFiles(event)) {
			event.preventDefault();
			event.stopPropagation();
			this.dispatchDOMEvent(this.cloneEvent(event,["dataTransfer"]));
		}
	};

	EditTextWidget.prototype.handlePasteEvent = function(event) {
		if(event.clipboardData && event.clipboardData.files && event.clipboardData.files.length) {
			event.preventDefault();
			event.stopPropagation();
			this.dispatchDOMEvent(this.cloneEvent(event,["clipboardData"]));
		}
	};

	EditTextWidget.prototype.handleDragEnterEvent = function(event) {
		if($tw.utils.dragEventContainsFiles(event)) {
			// Ignore excessive events fired by FF when entering and leaving text nodes in a text area.
			if( event.relatedTarget && (event.relatedTarget.nodeType === 3 || event.target === event.relatedTarget)) {
				return true;
			}
			event.preventDefault();
			return this.dispatchDOMEvent(this.cloneEvent(event,["dataTransfer"]));
		}
		return true;
	};

	EditTextWidget.prototype.handleDragOverEvent = function(event) {
		if($tw.utils.dragEventContainsFiles(event)) {
			// Call preventDefault() in browsers that default to not allowing drop events on textarea
			if($tw.browser.isFirefox || $tw.browser.isIE) {
				event.preventDefault();
			}
			event.dataTransfer.dropEffect = "copy";
			return this.dispatchDOMEvent(this.cloneEvent(event,["dataTransfer"]));
		}
		return true;
	};

	EditTextWidget.prototype.handleDragLeaveEvent = function(event) {
		// Ignore excessive events fired by FF when entering and leaving text nodes in a text area.
		if(event.relatedTarget && ((event.relatedTarget.nodeType === 3) || (event.target === event.relatedTarget))) {
			return true;
		}
		event.preventDefault();
		this.dispatchDOMEvent(this.cloneEvent(event,["dataTransfer"]));
	};

	EditTextWidget.prototype.handleDragEndEvent = function(event) {
		this.dispatchDOMEvent(this.cloneEvent(event));
	};

	EditTextWidget.prototype.handleClickEvent = function(event) {
		return !this.dispatchDOMEvent(this.cloneEvent(event));
	};

	return EditTextWidget;
}

exports.editTextWidgetFactory = editTextWidgetFactory;
