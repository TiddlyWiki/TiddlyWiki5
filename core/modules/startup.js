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
	$tw.Wiki.tiddlerSerializerModules = {};
	$tw.modules.applyMethods("tiddlerserializer",$tw.Wiki.tiddlerSerializerModules);
	$tw.modules.applyMethods("treeutils",$tw.Tree);
	$tw.modules.applyMethods("treenode",$tw.Tree);
	// Set up the wiki store
	$tw.wiki.initMacros();
	$tw.wiki.initEditors();
	$tw.wiki.initFieldViewers();
	$tw.wiki.initListViews();
	$tw.wiki.initParsers();
	$tw.wiki.initSyncers();
	$tw.wiki.initServerConnections();
	// Set up the command modules
	$tw.Commander.initCommands();
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
			wiki: $tw.wiki,
			rootElement: document.body
		});
		// Install the modal message mechanism
		$tw.modal = new $tw.utils.Modal($tw.wiki);
		document.addEventListener("tw-modal",function(event) {
			$tw.modal.display(event.param);
		},false);
		// Install the syncer message mechanism
		var handleSyncerEvent = function(event) {
			$tw.wiki.handleSyncerEvent.call($tw.wiki,event);
		};
		document.addEventListener("tw-login",handleSyncerEvent,false);
		document.addEventListener("tw-logout",handleSyncerEvent,false);
		// Install the scroller
		$tw.pageScroller = new $tw.utils.PageScroller();
		document.addEventListener("tw-scroll",$tw.pageScroller,false);
		// Install the sprite factory
		$tw.sprite = new $tw.utils.Sprite();
		// Install the save action handler
		$tw.wiki.initSavers();
		document.addEventListener("tw-save-wiki",function(event) {
			$tw.wiki.saveWiki({
				template: event.param,
				downloadType: "text/plain"
			});
		},false);
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
		// If we're being viewed on a data: URI then give instructions for how to save
		if(document.location.protocol === "data:") {
			var event = document.createEvent("Event");
			event.initEvent("tw-modal",true,true);
			event.param = "$:/messages/SaveInstructions";
			document.dispatchEvent(event);
		} 
		// Display the PageTemplate
		var template = "$:/templates/PageTemplate",
			title = template;
		$tw.renderer = $tw.wiki.parseTiddler(template);
		$tw.renderer.execute([],title);
		$tw.renderer.renderInDom(document.body);
		$tw.wiki.addEventListener("",function(changes) {
			$tw.renderer.refreshInDom(changes);
		});
	} else {
		// On the server, start a commander with the command line arguments
		commander = new $tw.Commander(
			Array.prototype.slice.call(process.argv,2),
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
