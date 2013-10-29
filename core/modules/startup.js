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

var widget = require("$:/core/modules/new_widgets/widget.js");

exports.startup = function() {
	var modules,n,m,f,commander;
	// Load modules
	$tw.modules.applyMethods("global",$tw);
	$tw.modules.applyMethods("config",$tw.config);
	$tw.modules.applyMethods("utils",$tw.utils);
	if($tw.browser) {
		$tw.utils.getBrowserInfo($tw.browser);
	}
	$tw.version = $tw.utils.extractVersionInfo();
	$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");
	$tw.modules.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.modules.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);
	$tw.macros = $tw.modules.getModulesByTypeAsHashmap("macro");
	// Set up the parsers
	$tw.wiki.initParsers();
	// Set up the syncer object
	$tw.syncer = new $tw.Syncer({wiki: $tw.wiki});
	// Set up the command modules
	$tw.Commander.initCommands();
	// Kick off the theme manager
	$tw.themeManager = new $tw.ThemeManager($tw.wiki);
	// Get the default tiddlers
	var defaultTiddlersTitle = "$:/DefaultTiddlers",
		defaultTiddlersTiddler = $tw.wiki.getTiddler(defaultTiddlersTitle),
		defaultTiddlers = [];
	if(defaultTiddlersTiddler) {
		defaultTiddlers = $tw.wiki.filterTiddlers(defaultTiddlersTiddler.fields.text);
	}
	// Initialise the story and history
	var storyTitle = "$:/StoryList",
		story = [];
	for(var t=0; t<defaultTiddlers.length; t++) {
		story[t] = defaultTiddlers[t];
	}
	$tw.wiki.addTiddler({title: storyTitle, text: "", list: story},$tw.wiki.getModificationFields());
	// Host-specific startup
	if($tw.browser) {
		// Install the popup manager
		$tw.popup = new $tw.utils.Popup({
			rootElement: document.body
		});
		// Install the animator
		$tw.anim = new $tw.utils.Animator();
		// Kick off the stylesheet manager
		$tw.stylesheetManager = new $tw.utils.StylesheetManager($tw.wiki);
		// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
		$tw.rootWidget = new widget.widget({type: "widget", children: []},{
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
		$tw.rootWidget.addEventListener("tw-scroll",$tw.pageScroller);
		// Install the save action handler
		$tw.wiki.initSavers();
		$tw.rootWidget.addEventListener("tw-save-wiki",function(event) {
			$tw.wiki.saveWiki({
				template: event.param,
				downloadType: "text/plain"
			});
		});
		// Install the crypto event handlers
		$tw.rootWidget.addEventListener("tw-set-password",function(event) {
			$tw.passwordPrompt.createPrompt({
				serviceName: "Set a new password for this TiddlyWiki",
				noUserName: true,
				submitText: "Set password",
				callback: function(data) {
					$tw.crypto.setPassword(data.password);
					return true; // Get rid of the password prompt
				}
			});
		});
		$tw.rootWidget.addEventListener("tw-clear-password",function(event) {
			$tw.crypto.setPassword(null);
		});
		// Display the PageTemplate
		var templateTitle = "$:/core/ui/PageTemplate",
			parser = $tw.wiki.new_parseTiddler(templateTitle),
			widgetNode = $tw.wiki.makeWidget(parser,{document: document, parentWidget: $tw.rootWidget});
		$tw.new_pageContainer = document.createElement("div");
		$tw.utils.addClass($tw.new_pageContainer,"tw-page-container");
		document.body.insertBefore($tw.new_pageContainer,document.body.firstChild);
		widgetNode.render($tw.new_pageContainer,null);
		$tw.wiki.addEventListener("change",function(changes) {
			widgetNode.refresh(changes,$tw.new_pageContainer,null);
		});
		// If we're being viewed on a data: URI then give instructions for how to save
		if(document.location.protocol === "data:") {
			$tw.utils.dispatchCustomEvent(document,"tw-modal",{
				param: "$:/messages/SaveInstructions"
			});
		}
		// Call browser startup modules
		$tw.modules.forEachModuleOfType("browser-startup",function(title,module) {
			if(module.startup) {
				module.startup();
			}
		});
	} else {
		// On the server, start a commander with the command line arguments
		commander = new $tw.Commander(
			$tw.boot.argv,
			function(err) {
				if(err) {
					console.log("Error: " + err);
				}
			},
			$tw.wiki,
			{output: process.stdout, error: process.stderr}
		);
		commander.execute();
	}

};

})();
