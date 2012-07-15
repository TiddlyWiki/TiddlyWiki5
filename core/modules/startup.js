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
	$tw.plugins.applyMethods("global",$tw);
	$tw.plugins.applyMethods("config",$tw.config);
	$tw.plugins.applyMethods("utils",$tw.utils);
	if($tw.browser) {
		$tw.utils.getBrowserInfo($tw.browser);
	}
	$tw.version = $tw.utils.extractVersionInfo();
	$tw.Tiddler.fieldPlugins = $tw.plugins.getPluginsByTypeAsHashmap("tiddlerfield");
	$tw.plugins.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.plugins.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.plugins.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerPlugins);
	$tw.Wiki.tiddlerSerializerPlugins = {};
	$tw.plugins.applyMethods("tiddlerserializer",$tw.Wiki.tiddlerSerializerPlugins);
	$tw.plugins.applyMethods("treeutils",$tw.Tree);
	$tw.plugins.applyMethods("treenode",$tw.Tree);
	// Set up the wiki store
	$tw.wiki.initMacros();
	$tw.wiki.initEditors();
	$tw.wiki.initStoryViews();
	$tw.wiki.initParsers();
	// Set up the command plugins
	$tw.Commander.initCommands();
	// Host-specific startup
	if($tw.browser) {
		// Install the popup manager
		$tw.popup = new $tw.utils.Popup({
			wiki: $tw.wiki,
			rootElement: document.body
		});
		// Install the modal message mechanism
		$tw.modal = new $tw.utils.Modal(this);
		document.addEventListener("tw-modal",function(event) {
			$tw.modal.display(event.param);
		},false);
		// Install the scroller
		$tw.scroller = new $tw.utils.Scroller();
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
		var storyTitle = "$:/StoryTiddlers",
			historyTitle = "$:/History",
			story = {tiddlers: []},
			history = {stack: []};
		for(var t=0; t<defaultTiddlers.length; t++) {
			story.tiddlers[t] = {title: defaultTiddlers[t]};
			history.stack[defaultTiddlers.length - t - 1] = {title: defaultTiddlers[t], fromTitle: defaultTiddlers[t+1]};
		}
		$tw.wiki.addTiddler(new $tw.Tiddler({title: storyTitle,text: JSON.stringify(story)}));
		$tw.wiki.addTiddler(new $tw.Tiddler({title: historyTitle,text: JSON.stringify(history)}));
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
		// Start a commander with the command line arguments
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
