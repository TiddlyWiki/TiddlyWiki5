/*\
title: $:/core/modules/utils/dom/modal.js
type: application/javascript
module-type: utils

Modal message mechanism

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");
const navigator = require("$:/core/modules/widgets/navigator.js");

class Modal {
	constructor(wiki) {
		this.wiki = wiki;
		this.modalCount = 0;
		// Detect if browser supports <dialog> element
		this.supportsDialog = typeof HTMLDialogElement !== "undefined";
	}

	/*
	Display a modal dialogue
		title: Title of tiddler to display
		options: see below
	Options include:
		event: widget event
		variables: from event.paramObject
	*/
	display(title, options = {}) {
		const useRootWindow = options.variables && (options.variables.rootwindow === "true" ||
				options.variables.rootwindow === "yes");
		this.srcDocument = useRootWindow ? document :
			(options.event && options.event.event && options.event.event.target ? options.event.event.target.ownerDocument : document);
		this.srcWindow = this.srcDocument.defaultView;
		const tiddler = this.wiki.getTiddler(title);
		// Don't do anything if the tiddler doesn't exist
		if(!tiddler) {
			return;
		}
		// Create variables to override - currentTiddler and any from options.variables
		const variables = $tw.utils.extend({
			currentTiddler: title
		}, options.variables);

		// Get navigator-specific variables from source widget if not already provided
		const sourceWidget = options.event && options.event.widget ? options.event.widget : null;
		if(sourceWidget) {
			if(!variables["tv-story-list"] && sourceWidget.variables["tv-story-list"]) {
				variables["tv-story-list"] = sourceWidget.variables["tv-story-list"].value;
			}
			if(!variables["tv-history-list"] && sourceWidget.variables["tv-history-list"]) {
				variables["tv-history-list"] = sourceWidget.variables["tv-history-list"].value;
			}
		}

		// Branch to appropriate implementation
		// Allow forcing legacy mode via forceLegacy parameter for testing
		const useLegacy = variables["forceLegacy"] === "yes";
		if(this.supportsDialog && !useLegacy) {
			this.displayWithDialog(title, options, variables, sourceWidget, useRootWindow);
		} else {
			this.displayWithDiv(title, options, variables, sourceWidget, useRootWindow);
		}
	}

	/*
	Display modal using native <dialog> element (modern browsers)
	*/
	displayWithDialog(title, options, variables, sourceWidget, useRootWindow) {

		// Create the dialog element
		const dialog = this.srcDocument.createElement("dialog");
	
		// Up the modal count and adjust the body class
		this.modalCount++;
		this.adjustPageClass();
	
		// Add classes
		$tw.utils.addClass(dialog,"tc-modal-dialog");
		if(variables["class"]) {
			$tw.utils.addClass(dialog, variables["class"]);
		}
		const navigatorTree = {
			"type": "navigator",
			"attributes": {
				"story": {
					"name": "story",
					"type": "string",
					"value": variables["tv-story-list"]
				},
				"history": {
					"name": "history",
					"type": "string",
					"value": variables["tv-history-list"]
				}
			},
			"tag": "$navigator",
			"isBlock": true,
			"children": []
		};
		const navigatorWidgetNode = new navigator.navigator(navigatorTree, {
			wiki: this.wiki,
			document: this.srcDocument,
			parentWidget: useRootWindow ? $tw.rootWidget : (sourceWidget || $tw.rootWidget)
		});
		navigatorWidgetNode.render(dialog,null);

		// Render the modal content using the story template
		const templateWidgetNode = this.wiki.makeTranscludeWidget("$:/core/ui/StoryTiddlerTemplate",{
			parentWidget: navigatorWidgetNode,
			document: this.srcDocument,
			importPageMacros: true
		});
		
		// Set passed variables to override any inherited from source widget
		$tw.utils.each(variables, function(value, name) {
			templateWidgetNode.setVariable(name, value);
		});
		templateWidgetNode.render(dialog,null);
	
		// Set up the refresh handler
		const refreshHandler = changes => {
			templateWidgetNode.refresh(changes,dialog,null);
		};
		this.wiki.addEventListener("change",refreshHandler);
		// Add the close event handler
		const closeHandler = event => {
		// Remove our refresh handler
			this.wiki.removeEventListener("change",refreshHandler);
			// Decrease the modal count and adjust the body class
			this.modalCount--;
			this.adjustPageClass();
			// Close and remove the dialog
			dialog.close();
			if(dialog.parentNode) {
				this.srcDocument.body.removeChild(dialog);
			}
			// Don't let anyone else handle the tm-close-tiddler message
			return false;
		};
		templateWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
		// Whether to close the modal dialog when the backdrop (area outside the modal) is clicked
		if(variables["maskClosable"] !== "no") {
			dialog.addEventListener("click", event => {
			// Close if clicking on the dialog backdrop (not its contents)
				if(event.target === dialog) {
					closeHandler(event);
				}
			}, false);
		}
		// Add the dialog to the document
		this.srcDocument.body.appendChild(dialog);
		// Show the modal dialog using the native API
		dialog.showModal();
	}

	/*
	Display modal using div-based approach (legacy browsers)
	*/
	displayWithDiv(title, options, variables, sourceWidget, useRootWindow) {

		// Collect all variables from source widget (walking up the widget tree)
		// Exclude any that are already in passed variables to avoid overriding them
		const sourceVariableObjects = {};
		if(sourceWidget) {
			for(var name in sourceWidget.variables) {
				if(!variables[name]) {
					sourceVariableObjects[name] = sourceWidget.variables[name];
				}
			}

		}

		// Create the wrapper divs
		const wrapper = this.srcDocument.createElement("div");
		const modalBackdrop = this.srcDocument.createElement("div");
		const modalWrapper = this.srcDocument.createElement("div");
		
		// Up the modal count and adjust the body class
		this.modalCount++;
		this.adjustPageClass();
		
		// Add classes
		$tw.utils.addClass(wrapper, "tc-modal-wrapper");
		if(variables["class"]) {
			$tw.utils.addClass(wrapper, variables["class"]);
		}
		$tw.utils.addClass(modalBackdrop, "tc-modal-backdrop");
		$tw.utils.addClass(modalWrapper, "tc-modal");
		
		// Join them together
		wrapper.appendChild(modalBackdrop);
		wrapper.appendChild(modalWrapper);
		
		// Create the navigator widget
		const navigatorTree = {
			"type": "navigator",
			"attributes": {
				"story": {
					"name": "story",
					"type": "string",
					"value": variables["tv-story-list"]
				},
				"history": {
					"name": "history",
					"type": "string",
					"value": variables["tv-history-list"]
				}
			},
			"tag": "$navigator",
			"isBlock": true,
			"children": []
		};
		const navigatorWidgetNode = new navigator.navigator(navigatorTree, {
			wiki: this.wiki,
			document: this.srcDocument,
			parentWidget: useRootWindow ? $tw.rootWidget : (sourceWidget || $tw.rootWidget)
		});
		navigatorWidgetNode.render(modalWrapper, null);

		// Render the modal content using the story template
		const templateWidgetNode = this.wiki.makeTranscludeWidget("$:/core/ui/StoryTiddlerTemplate", {
			parentWidget: navigatorWidgetNode,
			document: this.srcDocument,
			importPageMacros: true
		});
		
		// Copy all variables from source widget (using pre-collected variable objects)
		$tw.utils.each(sourceVariableObjects, function(variable, name) {
			templateWidgetNode.setVariable(
				name,
				variable.value,
				variable.params,
				variable.isMacroDefinition,
				{
					isFunctionDefinition: variable.isFunctionDefinition,
					isProcedureDefinition: variable.isProcedureDefinition,
					isWidgetDefinition: variable.isWidgetDefinition,
					configTrimWhiteSpace: variable.configTrimWhiteSpace
				}
			);
		});
		
		// Set passed variables, overriding any from source widget
		$tw.utils.each(variables, function(value, name) {
			templateWidgetNode.setVariable(name, value);
		});
		templateWidgetNode.render(modalWrapper, null);
		
		// Set up the refresh handler
		const refreshHandler = changes => {
			templateWidgetNode.refresh(changes, modalWrapper, null);
		};
		this.wiki.addEventListener("change", refreshHandler);
		
		// Add the close event handler
		const closeHandler = event => {
			// Remove our refresh handler
			this.wiki.removeEventListener("change", refreshHandler);
			// Decrease the modal count and adjust the body class
			this.modalCount--;
			this.adjustPageClass();
			// Remove the modal from the DOM
			if(wrapper.parentNode) {
				this.srcDocument.body.removeChild(wrapper);
			}
			// Don't let anyone else handle the tm-close-tiddler message
			return false;
		};
		templateWidgetNode.addEventListener("tm-close-tiddler", closeHandler, false);
		
		// Whether to close the modal dialog when the backdrop is clicked
		if(variables["maskClosable"] !== "no") {
			modalBackdrop.addEventListener("click", closeHandler, false);
		}
		
		// Add the modal to the document
		this.srcDocument.body.appendChild(wrapper);
	}

	adjustPageClass() {
		const windowContainer = $tw.pageContainer ? ($tw.pageContainer === this.srcDocument.body.firstChild ? $tw.pageContainer : this.srcDocument.body.firstChild) : null;
		if(windowContainer) {
			$tw.utils.toggleClass(windowContainer,"tc-modal-displayed",this.modalCount > 0);
		}
		// Only apply tc-modal-prevent-scroll for div-based modals (dialog handles this natively)
		if(!this.supportsDialog) {
			$tw.utils.toggleClass(this.srcDocument.body,"tc-modal-prevent-scroll",this.modalCount > 0);
		}
	}
}

exports.Modal = Modal;
