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
	downloadLink: Text of a big download link to include
	event: widget event
	variables: from event.paramObject
*/
Modal.prototype.display = function(title,options) {
	options = options || {};
	this.srcDocument = options.variables && (options.variables.rootwindow === "true" ||
		options.variables.rootwindow === "yes") ? document :
		(options.event && options.event.event && options.event.event.target ? options.event.event.target.ownerDocument : document);
	this.srcWindow = this.srcDocument.defaultView;
	const self = this;
	let refreshHandler;
	const duration = $tw.utils.getAnimationDuration();
	const tiddler = this.wiki.getTiddler(title);
	// Don't do anything if the tiddler doesn't exist
	if(!tiddler) {
		return;
	}
	// Create the variables
	const variables = $tw.utils.extend({
		currentTiddler: title,
		"tv-story-list": (options.event && options.event.widget ? options.event.widget.getVariable("tv-story-list") : ""),
		"tv-history-list": (options.event && options.event.widget ? options.event.widget.getVariable("tv-history-list") : "")
	},options.variables);

	// Create the wrapper divs
	const wrapper = this.srcDocument.createElement("div");
	const modalBackdrop = this.srcDocument.createElement("div");
	const modalWrapper = this.srcDocument.createElement("div");
	const modalHeader = this.srcDocument.createElement("div");
	const headerTitle = this.srcDocument.createElement("h3");
	const modalBody = this.srcDocument.createElement("div");
	const modalLink = this.srcDocument.createElement("a");
	const modalFooter = this.srcDocument.createElement("div");
	const modalFooterHelp = this.srcDocument.createElement("span");
	const modalFooterButtons = this.srcDocument.createElement("span");
	// Up the modal count and adjust the body class
	this.modalCount++;
	this.adjustPageClass();
	// Add classes
	$tw.utils.addClass(wrapper,"tc-modal-wrapper");
	if(tiddler.fields && tiddler.fields.class) {
		$tw.utils.addClass(wrapper,tiddler.fields.class);
	}
	$tw.utils.addClass(modalBackdrop,"tc-modal-backdrop");
	$tw.utils.addClass(modalWrapper,"tc-modal");
	$tw.utils.addClass(modalHeader,"tc-modal-header");
	$tw.utils.addClass(modalBody,"tc-modal-body");
	$tw.utils.addClass(modalFooter,"tc-modal-footer");
	// Join them together
	wrapper.appendChild(modalBackdrop);
	wrapper.appendChild(modalWrapper);
	modalHeader.appendChild(headerTitle);
	modalWrapper.appendChild(modalHeader);
	modalWrapper.appendChild(modalBody);
	modalFooter.appendChild(modalFooterHelp);
	modalFooter.appendChild(modalFooterButtons);
	modalWrapper.appendChild(modalFooter);
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
	const navigatorWidgetNode = new navigator.navigator(navigatorTree,{
		wiki: this.wiki,
		document: this.srcDocument,
		parentWidget: $tw.rootWidget
	});
	navigatorWidgetNode.render(modalBody,null);

	// Render the title of the message
	const headerWidgetNode = this.wiki.makeTranscludeWidget(title,{
		field: "subtitle",
		mode: "inline",
		children: [{
			type: "text",
			attributes: {
				text: {
					type: "string",
					value: title
				}
			}
		}],
		parentWidget: navigatorWidgetNode,
		document: this.srcDocument,
		variables,
		importPageMacros: true
	});
	headerWidgetNode.render(headerTitle,null);
	// Render the body of the message
	const bodyWidgetNode = this.wiki.makeTranscludeWidget(title,{
		parentWidget: navigatorWidgetNode,
		document: this.srcDocument,
		variables,
		importPageMacros: true
	});

	bodyWidgetNode.render(modalBody,null);
	// Setup the link if present
	if(options.downloadLink) {
		modalLink.href = options.downloadLink;
		modalLink.appendChild(this.srcDocument.createTextNode("Right-click to save changes"));
		modalBody.appendChild(modalLink);
	}
	// Render the footer of the message
	if(tiddler.fields && tiddler.fields.help) {
		const link = this.srcDocument.createElement("a");
		link.setAttribute("href",tiddler.fields.help);
		link.setAttribute("target","_blank");
		link.setAttribute("rel","noopener noreferrer");
		link.setAttribute("class","tc-tiddlylink-external");
		link.appendChild(this.srcDocument.createTextNode("Help"));
		modalFooterHelp.appendChild(link);
		modalFooterHelp.style.float = "left";
	}
	const footerWidgetNode = this.wiki.makeTranscludeWidget(title,{
		field: "footer",
		mode: "inline",
		children: [{
			type: "button",
			attributes: {
				message: {
					type: "string",
					value: "tm-close-tiddler"
				}
			},
			children: [{
				type: "text",
				attributes: {
					text: {
						type: "string",
						value: $tw.language.getString("Buttons/Close/Caption")
					}
				}
			}
			]
		}],
		parentWidget: navigatorWidgetNode,
		document: this.srcDocument,
		variables,
		importPageMacros: true
	});
	footerWidgetNode.render(modalFooterButtons,null);
	// Set up the refresh handler
	refreshHandler = function(changes) {
		headerWidgetNode.refresh(changes,modalHeader,null);
		bodyWidgetNode.refresh(changes,modalBody,null);
		footerWidgetNode.refresh(changes,modalFooterButtons,null);
	};
	this.wiki.addEventListener("change",refreshHandler);
	// Add the close event handler
	const closeHandler = function(event) {
		// Remove our refresh handler
		self.wiki.removeEventListener("change",refreshHandler);
		// Decrease the modal count and adjust the body class
		self.modalCount--;
		self.adjustPageClass();
		// Force layout and animate the modal message away
		$tw.utils.forceLayout(modalBackdrop);
		$tw.utils.forceLayout(modalWrapper);
		$tw.utils.setStyle(modalBackdrop,[
			{opacity: "0"}
		]);
		$tw.utils.setStyle(modalWrapper,[
			{transform: `translateY(${self.srcWindow.innerHeight}px)`}
		]);
		// Set up an event for the transition end
		self.srcWindow.setTimeout(() => {
			if(wrapper.parentNode) {
				// Remove the modal message from the DOM
				self.srcDocument.body.removeChild(wrapper);
			}
		},duration);
		// Don't let anyone else handle the tm-close-tiddler message
		return false;
	};
	headerWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
	bodyWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
	footerWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
	// Whether to close the modal dialog when the mask (area outside the modal) is clicked
	if(tiddler.fields && (tiddler.fields["mask-closable"] === "yes" || tiddler.fields["mask-closable"] === "true")) {
		modalBackdrop.addEventListener("click",closeHandler,false);
	}
	// Set the initial styles for the message
	$tw.utils.setStyle(modalBackdrop,[
		{opacity: "0"}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transformOrigin: "0% 0%"},
		{transform: `translateY(${-this.srcWindow.innerHeight}px)`}
	]);
	// Put the message into the document
	this.srcDocument.body.appendChild(wrapper);
	// Set up animation for the styles
	$tw.utils.setStyle(modalBackdrop,[
		{transition: `opacity ${duration}ms ease-out`}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transition: `${$tw.utils.roundTripPropertyName("transform")} ${duration}ms ease-in-out`}
	]);
	// Force layout
	$tw.utils.forceLayout(modalBackdrop);
	$tw.utils.forceLayout(modalWrapper);
	// Set final animated styles
	$tw.utils.setStyle(modalBackdrop,[
		{opacity: "0.7"}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transform: "translateY(0px)"}
	]);
};

Modal.prototype.adjustPageClass = function() {
	const windowContainer = $tw.pageContainer ? ($tw.pageContainer === this.srcDocument.body.firstChild ? $tw.pageContainer : this.srcDocument.body.firstChild) : null;
	if(windowContainer) {
		$tw.utils.toggleClass(windowContainer,"tc-modal-displayed",this.modalCount > 0);
	}
	$tw.utils.toggleClass(this.srcDocument.body,"tc-modal-prevent-scroll",this.modalCount > 0);
};

exports.Modal = Modal;
