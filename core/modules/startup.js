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
	$tw.wiki.addTiddler({title: storyTitle, text: story.join("\n")});
	// Host-specific startup
	if($tw.browser) {
		// Call browser startup modules
		$tw.modules.forEachModuleOfType("browser-startup",function(title,module) {
			if(module.startup) {
				module.startup();
			}
		});
		// Install the popup manager
		$tw.popup = new $tw.utils.Popup({
			rootElement: document.body
		});
		// Install the modal message mechanism
		$tw.modal = new $tw.utils.Modal($tw.wiki);
		document.addEventListener("tw-modal",function(event) {
			$tw.modal.display(event.param);
		},false);
		// Install the notification  mechanism
		$tw.notifier = new $tw.utils.Notifier($tw.wiki);
		document.addEventListener("tw-notify",function(event) {
			$tw.notifier.display(event.param);
		},false);
		// Install the scroller
		$tw.pageScroller = new $tw.utils.PageScroller();
		document.addEventListener("tw-scroll",$tw.pageScroller,false);
		// Install the save action handler
		$tw.wiki.initSavers();
		document.addEventListener("tw-save-wiki",function(event) {
			$tw.wiki.saveWiki({
				template: event.param,
				downloadType: "text/plain"
			});
		},false);
		// Install the crypto event handlers
		document.addEventListener("tw-set-password",function(event) {
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
		document.addEventListener("tw-clear-password",function(event) {
			$tw.crypto.setPassword(null);
		});
		// Kick off the stylesheet manager
		$tw.stylesheetManager = new $tw.utils.StylesheetManager($tw.wiki);
		// If we're being viewed on a data: URI then give instructions for how to save
		if(document.location.protocol === "data:") {
			$tw.utils.dispatchCustomEvent(document,"tw-modal",{
				param: "$:/messages/SaveInstructions"
			});
		} else if($tw.wiki.countTiddlers() === 0){
			// Otherwise, if give instructions if this is an empty TiddlyWiki
			$tw.utils.dispatchCustomEvent(document,"tw-modal",{
				param: "$:/messages/GettingStarted"
			});
		}
		// Display the PageTemplate
		var templateTitle = "$:/templates/PageTemplate",
			parser = $tw.wiki.parseTiddler(templateTitle),
			renderTree = new $tw.WikiRenderTree(parser,{wiki: $tw.wiki, context: {tiddlerTitle: templateTitle}, document: document});
		renderTree.execute();
		var container = document.createElement("div");
		document.body.insertBefore(container,document.body.firstChild);
		renderTree.renderInDom(container);
		$tw.wiki.addEventListener("change",function(changes) {
			renderTree.refreshInDom(changes);
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
