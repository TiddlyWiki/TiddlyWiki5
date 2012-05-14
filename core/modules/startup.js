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
	// Set up additional global objects
	$tw.plugins.applyMethods("global",$tw);
	// Wire up plugin modules
	$tw.plugins.applyMethods("config",$tw.config);
	$tw.plugins.applyMethods("utils",$tw.utils);
	$tw.Tiddler.fieldPlugins = $tw.plugins.getPluginsByTypeAsHashmap("tiddlerfield");
	$tw.plugins.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.plugins.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.plugins.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerPlugins);
	$tw.Wiki.tiddlerSerializerPlugins = {};
	$tw.plugins.applyMethods("tiddlerserializer",$tw.Wiki.tiddlerSerializerPlugins);
	$tw.plugins.applyMethods("treeutils",$tw.Tree);
	$tw.plugins.applyMethods("treenode",$tw.Tree);
	// Get version information
	$tw.version = $tw.utils.extractVersionInfo();
	// Load up the tiddlers in the root of the core directory (we couldn't do before because we didn't have the serializers installed)
	if(!$tw.isBrowser) {
		$tw.plugins.loadPluginsFromFolder($tw.boot.bootPath,"$:/core",/^\.DS_Store$|.meta$|^modules$/);
	}
	// Set up the wiki store
	$tw.wiki.initMacros();
	$tw.wiki.initEditors();
	$tw.wiki.initStoryViews();
	$tw.wiki.initParsers();
	// Set up the command plugins
	$tw.Commander.initCommands();
	// Host-specific startup
	if($tw.isBrowser) {
		// Display the PageTemplate
		var renderer = $tw.wiki.parseTiddler("PageTemplate");
		renderer.execute([],"PageTemplate");
		renderer.renderInDom(document.body);
		$tw.wiki.addEventListener("",function(changes) {
			renderer.refreshInDom(changes);
		});
		console.log("$tw",$tw);
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
