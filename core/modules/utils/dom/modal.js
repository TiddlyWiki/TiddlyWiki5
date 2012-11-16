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

var Modal = function(wiki) {
	this.wiki = wiki;
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
	// Create the wrapper divs
	var wrapper = document.createElement("div"),
		modalBackdrop = document.createElement("div"),
		modalWrapper = document.createElement("div"),
		modalHeader = document.createElement("div"),
		headerTitle = document.createElement("h1"),
		modalBody = document.createElement("div"),
		modalLink = document.createElement("a"),
		modalFooter = document.createElement("div"),
		modalFooterHelp = document.createElement("span"),
		modalFooterButtons = document.createElement("span"),
		tiddler = this.wiki.getTiddler(title),
		d = $tw.config.preferences.animationDuration + "ms";
	// Add classes
	$tw.utils.addClass(modalBackdrop,"modal-backdrop");
	$tw.utils.addClass(modalWrapper,"modal");
	$tw.utils.addClass(modalHeader,"modal-header");
	$tw.utils.addClass(modalBody,"modal-body");
	$tw.utils.addClass(modalLink,"btn btn-large btn-block btn-success");
	$tw.utils.addClass(modalFooter,"modal-footer");
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
	var titleText;
	if(tiddler && tiddler.fields && tiddler.fields.subtitle) {
		titleText = tiddler.fields.subtitle;
	} else {
		titleText = title;
	}
	var headerRenderer = this.wiki.parseText("text/x-tiddlywiki-run",titleText);
	headerRenderer.execute([],title);
	headerRenderer.renderInDom(headerTitle);
	this.wiki.addEventListener("",function(changes) {
		headerRenderer.refreshInDom(changes);
	});
	// Render the body of the message
	var bodyRenderer = this.wiki.parseTiddler(title);
	bodyRenderer.execute([],title);
	bodyRenderer.renderInDom(modalBody);
	this.wiki.addEventListener("",function(changes) {
		bodyRenderer.refreshInDom(changes);
	});
	// Setup the link if present
	if(options.downloadLink) {
		modalLink.href = options.downloadLink
		modalLink.appendChild(document.createTextNode("Download"));
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
	var footerText;
	if(tiddler && tiddler.fields && tiddler.fields.footer) {
		footerText = tiddler.fields.footer;
	} else {
		footerText = "<<button close class:'btn btn-primary'><Close>>";
	}
	var footerRenderer = this.wiki.parseText("text/x-tiddlywiki-run",footerText);
	footerRenderer.execute([],title);
	footerRenderer.renderInDom(modalFooterButtons);
	this.wiki.addEventListener("",function(changes) {
		footerRenderer.refreshInDom(changes);
	});
	// Add the close event handler
	wrapper.addEventListener("tw-close",function(event) {
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
		modalWrapper.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
			if(wrapper.parentNode) {
				// Remove the modal message from the DOM
				document.body.removeChild(wrapper);
			}
		},false);
		// Don't let anyone else handle the tw-close message
		event.stopPropagation();
		return false;
	},false);
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
		{transition: "opacity " + d + " ease-out"}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out"}
	]);
	// Force layout
	$tw.utils.forceLayout(modalBackdrop);
	$tw.utils.forceLayout(modalWrapper);
	// Set final animated styles
	$tw.utils.setStyle(modalBackdrop,[
		{opacity: "1"}
	]);
	$tw.utils.setStyle(modalWrapper,[
		{transform: "translateY(0px)"}
	]);
};

exports.Modal = Modal;

})();
