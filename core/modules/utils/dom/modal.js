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

Modal.prototype.display = function(title) {
	// Create the wrapper divs
	var wrapper = document.createElement("div"),
		modalBackdrop = document.createElement("div"),
		modalWrapper = document.createElement("div"),
		modalHeader = document.createElement("div"),
		headerTitle = document.createElement("h1"),
		modalBody = document.createElement("div"),
		modalFooter = document.createElement("div"),
		modalFooterHelp = document.createElement("span"),
		modalFooterButtons = document.createElement("span"),
		tiddler = this.wiki.getTiddler(title);
	// Add classes
	$tw.utils.addClass(modalBackdrop,"modal-backdrop");
	$tw.utils.addClass(modalWrapper,"modal");
	$tw.utils.addClass(modalHeader,"modal-header");
	$tw.utils.addClass(modalBody,"modal-body");
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
	var headerRenderer = this.wiki.parseText("text/x-tiddlywiki-run","<<view subtitle wikified>>");
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
	// Render the footer of the message
	if(tiddler && tiddler.fields && tiddler.fields.help) {
		var link = document.createElement("a");
		link.setAttribute("href",tiddler.fields.help);
		link.setAttribute("target","_blank");
		link.appendChild(document.createTextNode("Help"));
		modalFooterHelp.appendChild(link);
		modalFooterHelp.style.float = "left";
	}
	var footerRenderer = this.wiki.parseText("text/x-tiddlywiki-run","<<view footer wikified>>");
	footerRenderer.execute([],title);
	footerRenderer.renderInDom(modalFooterButtons);
	this.wiki.addEventListener("",function(changes) {
		footerRenderer.refreshInDom(changes);
	});
	// Add the close event handler
	wrapper.addEventListener("tw-close",function(event) {
		document.body.removeChild(wrapper);
		event.stopPropagation();
		return false;
	},false);
	// Put the message into the document
	document.body.appendChild(wrapper);
};

exports.Modal = Modal;

})();
