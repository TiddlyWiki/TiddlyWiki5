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

var widget = require("$:/core/modules/widgets/widget.js");

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
		// Install the save action handler
		$tw.wiki.initSavers();
		$tw.rootWidget.addEventListener("tw-save-wiki",function(event) {
			$tw.wiki.saveWiki({
				template: event.param,
				downloadType: "text/plain"
			});
		});
		$tw.rootWidget.addEventListener("tw-download-file",function(event) {
			$tw.wiki.saveWiki({
				method: "download",
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
		// Set up the favicon
		var faviconTitle = "$:/favicon.ico",
			faviconLink = document.getElementById("faviconLink"),
			setFavicon = function() {
				var tiddler = $tw.wiki.getTiddler(faviconTitle);
				if(tiddler) {
					faviconLink.setAttribute("href","data:" + tiddler.fields.type + ";base64," + tiddler.fields.text);
				}
			};
		setFavicon();
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.utils.hop(changes,faviconTitle)) {
				setFavicon();
			}
		});
		// Set up the styles
		var styleTemplateTitle = "$:/core/ui/PageStylesheet",
			styleParser = $tw.wiki.parseTiddler(styleTemplateTitle);
		$tw.styleWidgetNode = $tw.wiki.makeWidget(styleParser,{document: $tw.document});
		$tw.styleContainer = $tw.document.createElement("style");
		$tw.styleWidgetNode.render($tw.styleContainer,null);
		$tw.styleElement = document.createElement("style");
		$tw.styleElement.innerHTML = $tw.styleContainer.textContent;
		document.head.insertBefore($tw.styleElement,document.head.firstChild);
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.styleWidgetNode.refresh(changes,$tw.styleContainer,null)) {
				$tw.styleElement.innerHTML = $tw.styleContainer.textContent;
			}
		});
		// Display the PageMacros, which includes the PageTemplate
		var templateTitle = "$:/core/ui/PageMacros",
			parser = $tw.wiki.parseTiddler(templateTitle);
		$tw.pageWidgetNode = $tw.wiki.makeWidget(parser,{document: document, parentWidget: $tw.rootWidget});
		$tw.pageContainer = document.createElement("div");
		$tw.utils.addClass($tw.pageContainer,"tw-page-container");
		document.body.insertBefore($tw.pageContainer,document.body.firstChild);
		$tw.pageWidgetNode.render($tw.pageContainer,null);
		$tw.wiki.addEventListener("change",function(changes) {
			$tw.pageWidgetNode.refresh(changes,$tw.pageContainer,null);
		});
		// Fix up the link between the root widget and the page container
		$tw.rootWidget.domNodes = [$tw.pageContainer];
		$tw.rootWidget.children = [$tw.pageWidgetNode];
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
