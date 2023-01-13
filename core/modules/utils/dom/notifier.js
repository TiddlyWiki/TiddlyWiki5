/*\
title: $:/core/modules/utils/dom/notifier.js
type: application/javascript
module-type: utils

Notifier mechanism

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

var Notifier = function(wiki) {
	this.wiki = wiki;
};

/*
Display a notification
	title: Title of tiddler containing the notification text
	options: see below
Options include:
*/
Notifier.prototype.display = function(title,options) {
	options = options || {};
	// Create the wrapper divs
	var self = this,
		notification = document.createElement("div"),
		tiddler = this.wiki.getTiddler(title),
		duration = $tw.utils.getAnimationDuration(),
		refreshHandler;
	// Don't do anything if the tiddler doesn't exist
	if(!tiddler) {
		return;
	}
	// Add classes and roles
	$tw.utils.addClass(notification,"tc-notification");
	notification.setAttribute("role","alert");
	// Create the variables
	var variables = $tw.utils.extend({currentTiddler: title},options.variables);
	// Render the body of the notification
	var widgetNode = this.wiki.makeTranscludeWidget(title,{
		parentWidget: $tw.rootWidget,
		document: document,
		variables: variables,
		importPageMacros: true});
	widgetNode.render(notification,null);
	refreshHandler = function(changes) {
		widgetNode.refresh(changes,notification,null);
	};
	this.wiki.addEventListener("change",refreshHandler);
	// Set the initial styles for the notification
	$tw.utils.setStyle(notification,[
		{opacity: "0"},
		{transformOrigin: "0% 0%"},
		{transform: "translateY(" + (-window.innerHeight) + "px)"},
		{transition: "opacity " + duration + "ms ease-out, " + $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms ease-in-out"}
	]);
	// Add the notification to the DOM
	document.body.appendChild(notification);
	// Force layout
	$tw.utils.forceLayout(notification);
	// Set final animated styles
	$tw.utils.setStyle(notification,[
		{opacity: "1.0"},
		{transform: "translateY(0px)"}
	]);
	// Set a timer to remove the notification
	window.setTimeout(function() {
		// Remove our change event handler
		self.wiki.removeEventListener("change",refreshHandler);
		// Force layout and animate the notification away
		$tw.utils.forceLayout(notification);
		$tw.utils.setStyle(notification,[
			{opacity: "0.0"},
			{transform: "translateX(" + (notification.offsetWidth) + "px)"}
		]);
		// Remove the modal message from the DOM once the transition ends
		setTimeout(function() {
			if(notification.parentNode) {
				document.body.removeChild(notification);
			}
		},duration);
	},$tw.config.preferences.notificationDuration);
};

exports.Notifier = Notifier;

})();
