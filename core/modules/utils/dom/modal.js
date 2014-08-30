/*\
title: $:/core/modules/utils/dom/modal.js
type: application/javascript
module-type: utils

Modal message mechanism

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

var Modal = function(wiki) {
	this.wiki = wiki;
	this.modalCount = 0;
};

/*
Display a modal dialogue
	title: Title of tiddler to display
	options: see below
Options include:
	downloadLink: Text of a big download link to include
*/
Modal.prototype.display = function(title,options) {
	options = options || {};
	var self = this,
		duration = $tw.utils.getAnimationDuration(),
		tiddler = this.wiki.getTiddler(title);
	// Don't do anything if the tiddler doesn't exist
	if(!tiddler) {
		return;
	}
	// Create the wrapper divs
	var wrapper = document.createElement("div"),
		modalBackdrop = document.createElement("div"),
		modalWrapper = document.createElement("div"),
		modalHeader = document.createElement("div"),
		headerTitle = document.createElement("h3"),
		modalBody = document.createElement("div"),
		modalLink = document.createElement("a"),
		modalFooter = document.createElement("div"),
		modalFooterHelp = document.createElement("span"),
		modalFooterButtons = document.createElement("span");
	// Up the modal count and adjust the body class
	this.modalCount++;
	this.adjustPageClass();
	// Add classes
	$tw.utils.addClass(wrapper,"tc-modal-wrapper");
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
	// Render the title of the message
	var headerWidgetNode = this.wiki.makeTranscludeWidget(title,{
		field: "subtitle",
		children: [{
			type: "text",
			attributes: {
				text: {
					type: "string",
					value: title
		}}}],
		parentWidget: $tw.rootWidget,
		document: document
	});
	headerWidgetNode.render(headerTitle,null);
	this.wiki.addEventListener("change",function(changes) {
		headerWidgetNode.refresh(changes,modalHeader,null);
	});
	// Render the body of the message
	var bodyWidgetNode = this.wiki.makeTranscludeWidget(title,{
		parentWidget: $tw.rootWidget,
		document: document
	});
	bodyWidgetNode.render(modalBody,null);
	this.wiki.addEventListener("change",function(changes) {
		bodyWidgetNode.refresh(changes,modalBody,null);
	});
	// Setup the link if present
	if(options.downloadLink) {
		modalLink.href = options.downloadLink
		modalLink.appendChild(document.createTextNode("Right-click to save changes"));
		modalBody.appendChild(modalLink);
	}
	// Render the footer of the message
	if(tiddler && tiddler.fields && tiddler.fields.help) {
		var link = document.createElement("a");
		link.setAttribute("href",tiddler.fields.help);
		link.setAttribute("target","_blank");
		link.appendChild(document.createTextNode("Help"));
		modalFooterHelp.appendChild(link);
		modalFooterHelp.style.float = "left";
	}
	var footerWidgetNode = this.wiki.makeTranscludeWidget(title,{
		field: "footer",
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
						value: "Close"
			}}}
		]}],
		parentWidget: $tw.rootWidget,
		document: document
	});
	footerWidgetNode.render(modalFooterButtons,null);
	this.wiki.addEventListener("change",function(changes) {
		footerWidgetNode.refresh(changes,modalFooterButtons,null);
	});
	// Add the close event handler
	var closeHandler = function(event) {
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
			{transform: "translateY(" + window.innerHeight + "px)"}
		]);
		// Set up an event for the transition end
		window.setTimeout(function() {
			if(wrapper.parentNode) {
				// Remove the modal message from the DOM
				document.body.removeChild(wrapper);
			}
		},duration);
		// Don't let anyone else handle the tm-close-tiddler message
		return false;
	};
	headerWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
	bodyWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
	footerWidgetNode.addEventListener("tm-close-tiddler",closeHandler,false);
	// Set the initial styles for the message
	$tw.utils.setStyle(modalBackdrop,[
		{opacity: "0"}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transformOrigin: "0% 0%"},
		{transform: "translateY(" + (-window.innerHeight) + "px)"}
	]);
	// Put the message into the document
	document.body.appendChild(wrapper);
	// Set up animation for the styles
	$tw.utils.setStyle(modalBackdrop,[
		{transition: "opacity " + duration + "ms ease-out"}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms ease-in-out"}
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
	if($tw.pageContainer) {
		$tw.utils.toggleClass($tw.pageContainer,"tc-modal-displayed",this.modalCount > 0);
	}
};

exports.Modal = Modal;

})();
