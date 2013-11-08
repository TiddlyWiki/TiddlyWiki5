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
	var notification = document.createElement("div"),
		tiddler = this.wiki.getTiddler(title),
		duration = $tw.utils.getAnimationDuration();
	// Don't do anything if the tiddler doesn't exist
	if(!tiddler) {
		return;
	}
	// Add classes
	$tw.utils.addClass(notification,"tw-notification");
	// Render the body of the notification
	var parser = this.wiki.parseTiddler(title),
		widgetNode = this.wiki.makeWidget(parser,{parentWidget: $tw.rootWidget, document: document});
	widgetNode.render(notification,null);
	this.wiki.addEventListener("change",function(changes) {
		widgetNode.refresh(changes,notification,null);
	});
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
		// Force layout and animate the notification away
		$tw.utils.forceLayout(notification);
		$tw.utils.setStyle(notification,[
			{opacity: "0.0"},
			{transform: "translateX(" + (notification.offsetWidth) + "px)"}
		]);
		// Set up an event for the transition end
		notification.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
			if(notification.parentNode) {
				// Remove the modal message from the DOM
				document.body.removeChild(notification);
			}
		},false);
	},$tw.config.preferences.notificationDuration);
};

exports.Notifier = Notifier;

})();
