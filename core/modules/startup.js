/*\
title: $:/core/modules/startup.js
type: application/javascript
module-type: startup

This is the main application logic for both the client and server

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "startup";
exports.after = ["load-modules"];
exports.synchronous = true;

// Set to `true` to enable performance instrumentation
var PERFORMANCE_INSTRUMENTATION = false;

var widget = require("$:/core/modules/widgets/widget.js");

exports.startup = function() {
	var modules,n,m,f;
	if($tw.browser) {
		$tw.browser.isIE = (/msie|trident/i.test(navigator.userAgent));
	}
	$tw.version = $tw.utils.extractVersionInfo();
	// Set up the performance framework
	$tw.perf = new $tw.Performance(PERFORMANCE_INSTRUMENTATION);
	// Kick off the language manager and switcher
	$tw.language = new $tw.Language();
	$tw.languageSwitcher = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "language",
		controllerTitle: "$:/language",
		defaultPlugins: [
			"$:/languages/en-US"
		]
	});
	// Kick off the theme manager
	$tw.themeManager = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "theme",
		controllerTitle: "$:/theme",
		defaultPlugins: [
			"$:/themes/tiddlywiki/snowwhite",
			"$:/themes/tiddlywiki/vanilla"
		]
	});
	// Clear outstanding tiddler store change events to avoid an unnecessary refresh cycle at startup
	$tw.wiki.clearTiddlerEventQueue();
	// Set up the syncer object
	$tw.syncer = new $tw.Syncer({wiki: $tw.wiki});
	// Host-specific startup
	if($tw.browser) {
		// Set up our beforeunload handler
		window.addEventListener("beforeunload",function(event) {
			var confirmationMessage = undefined;
			if($tw.syncer.isDirty()) {
				confirmationMessage = "You have unsaved changes in TiddlyWiki";
				event.returnValue = confirmationMessage; // Gecko
			}
			return confirmationMessage;
		});
		// Install the popup manager
		$tw.popup = new $tw.utils.Popup({
			rootElement: document.body
		});
		// Install the animator
		$tw.anim = new $tw.utils.Animator();
		// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
		$tw.rootWidget = new widget.widget({
			type: "widget",
			children: []
		},{
			wiki: $tw.wiki,
			document: document
		});
		// Install the modal message mechanism
		$tw.modal = new $tw.utils.Modal($tw.wiki);
		$tw.rootWidget.addEventListener("tw-modal",function(event) {
			$tw.modal.display(event.param);
		});
		// Install the notification  mechanism
		$tw.notifier = new $tw.utils.Notifier($tw.wiki);
		$tw.rootWidget.addEventListener("tw-notify",function(event) {
			$tw.notifier.display(event.param);
		});
		// Install the scroller
		$tw.pageScroller = new $tw.utils.PageScroller();
		$tw.rootWidget.addEventListener("tw-scroll",function(event) {
			$tw.pageScroller.handleEvent(event);
		});
		// Listen for the tw-home message
		$tw.rootWidget.addEventListener("tw-home",function(event) {
			displayDefaultTiddlers();
		});
		// Install the save action handlers
		$tw.rootWidget.addEventListener("tw-save-wiki",function(event) {
			$tw.syncer.saveWiki({
				template: event.param,
				downloadType: "text/plain"
			});
		});
		$tw.rootWidget.addEventListener("tw-auto-save-wiki",function(event) {
			$tw.syncer.saveWiki({
				method: "autosave",
				template: event.param,
				downloadType: "text/plain"
			});
		});
		$tw.rootWidget.addEventListener("tw-download-file",function(event) {
			$tw.syncer.saveWiki({
				method: "download",
				template: event.param,
				downloadType: "text/plain"
			});
		});
		// If we're being viewed on a data: URI then give instructions for how to save
		if(document.location.protocol === "data:") {
			$tw.utils.dispatchCustomEvent(document,"tw-modal",{
				param: "$:/language/Modals/SaveInstructions"
			});
		}
	}
};

})();
