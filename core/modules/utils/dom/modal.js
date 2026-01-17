/*\
title: $:/core/modules/utils/dom/modal.js
type: application/javascript
module-type: utils

Modal message mechanism

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");
const navigator = require("$:/core/modules/widgets/navigator.js");

const Modal = function(wiki) {
	this.wiki = wiki;
	this.modalCount = 0;
};

/*
Display a modal dialogue
	title: Title of tiddler to display
	options: see below
Options include:
	event: widget event
	variables: from event.paramObject
*/
Modal.prototype.display = function(title, options = {}) {
	this.srcDocument = options.variables && (options.variables.rootwindow === "true" ||
				options.variables.rootwindow === "yes") ? document :
		(options.event && options.event.event && options.event.event.target ? options.event.event.target.ownerDocument : document);
	this.srcWindow = this.srcDocument.defaultView;
	const tiddler = this.wiki.getTiddler(title);
	// Don't do anything if the tiddler doesn't exist
	if(!tiddler) {
		return;
	}
	// Create the variables - start with variables from the source widget
	const variables = {};
	// Collect variables from the source widget (the origin of the tm-modal message)
	if(options.event && options.event.widget && options.event.widget.variables) {
		// Copy all variables from the calling widget
		for(let varName in options.event.widget.variables) {
			variables[varName] = options.event.widget.variables[varName].value;
		}
	}
	// Override with specific variables for modals
	$tw.utils.extend(variables, {
		currentTiddler: title
	}, options.variables);

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
		parentWidget: $tw.rootWidget
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
	const refreshHandler = (changes) => {
		templateWidgetNode.refresh(changes,dialog,null);
	};
	this.wiki.addEventListener("change",refreshHandler);
	// Add the close event handler
	const closeHandler = (event) => {
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
	if(variables["$mask-closable"] !== "no") {
		dialog.addEventListener("click", (event) => {
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
};

Modal.prototype.adjustPageClass = function() {
	const windowContainer = $tw.pageContainer ? ($tw.pageContainer === this.srcDocument.body.firstChild ? $tw.pageContainer : this.srcDocument.body.firstChild) : null;
	if(windowContainer) {
		$tw.utils.toggleClass(windowContainer,"tc-modal-displayed",this.modalCount > 0);
	}
};

exports.Modal = Modal;
