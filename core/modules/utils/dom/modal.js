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
		this.srcDocument = options.variables && (options.variables.rootwindow === "true" ||
				options.variables.rootwindow === "yes") ? document :
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

		// Branch to appropriate implementation
		// Allow forcing legacy mode via $forceLegacy parameter for testing
		const useLegacy = variables["$forceLegacy"] === "yes";
		if(this.supportsDialog && !useLegacy) {
			this.displayWithDialog(title, options, variables);
		} else {
			this.displayWithDiv(title, options, variables);
		}
	}

	/*
	Display modal using native <dialog> element (modern browsers)
	*/
	displayWithDialog(title, options, variables) {

		// Create the dialog element
		const dialog = this.srcDocument.createElement("dialog");
	
		// Up the modal count and adjust the body class
		this.modalCount++;
		this.adjustPageClass();
	
		// Add classes
		$tw.utils.addClass(dialog,"tc-modal");
		if(variables["$class"]) {
			$tw.utils.addClass(dialog,variables["$class"]);
		}

		// Create the navigator widget with story template transcluded inside
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
			parentWidget: options.event && options.event.widget ? options.event.widget : $tw.rootWidget
		});
		navigatorWidgetNode.render(dialog,null);

		// Render the modal content using the story template
		const templateWidgetNode = this.wiki.makeTranscludeWidget("$:/core/ui/StoryTiddlerTemplate",{
			parentWidget: navigatorWidgetNode,
			document: this.srcDocument,
			variables,
			importPageMacros: true
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
		if(variables["$maskClosable"] !== "no") {
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
	displayWithDiv(title, options, variables) {
		const duration = $tw.utils.getAnimationDuration();

		// Create the wrapper divs
		const wrapper = this.srcDocument.createElement("div");
		const modalBackdrop = this.srcDocument.createElement("div");
		const modalWrapper = this.srcDocument.createElement("div");
		
		// Up the modal count and adjust the body class
		this.modalCount++;
		this.adjustPageClass();
		
		// Add classes
		$tw.utils.addClass(wrapper, "tc-modal-wrapper");
		if(variables["$class"]) {
			$tw.utils.addClass(wrapper, variables["$class"]);
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
			parentWidget: options.event && options.event.widget ? options.event.widget : $tw.rootWidget
		});
		navigatorWidgetNode.render(modalWrapper, null);

		// Render the modal content using the story template
		const templateWidgetNode = this.wiki.makeTranscludeWidget("$:/core/ui/StoryTiddlerTemplate", {
			parentWidget: navigatorWidgetNode,
			document: this.srcDocument,
			variables,
			importPageMacros: true
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
			// Fade out the backdrop
			$tw.utils.forceLayout(modalBackdrop);
			$tw.utils.setStyle(modalBackdrop, [
				{opacity: "0"}
			]);
			// Set up an event for the transition end
			this.srcWindow.setTimeout(() => {
				if(wrapper.parentNode) {
					// Remove the modal message from the DOM
					this.srcDocument.body.removeChild(wrapper);
				}
			}, duration);
			// Don't let anyone else handle the tm-close-tiddler message
			return false;
		};
		templateWidgetNode.addEventListener("tm-close-tiddler", closeHandler, false);
		
		// Whether to close the modal dialog when the backdrop is clicked
		if(variables["$maskClosable"] !== "no") {
			modalBackdrop.addEventListener("click", closeHandler, false);
		}
		
		// Set the initial styles for the message
		$tw.utils.setStyle(modalBackdrop, [
			{opacity: "0"}
		]);
		// Put the message into the document
		this.srcDocument.body.appendChild(wrapper);
		// Set up animation for the backdrop fade-in
		$tw.utils.setStyle(modalBackdrop, [
			{transition: "opacity " + duration + "ms ease-out"}
		]);
		// Force layout
		$tw.utils.forceLayout(modalBackdrop);
		// Set final animated style
		$tw.utils.setStyle(modalBackdrop, [
			{opacity: "0.7"}
		]);
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
