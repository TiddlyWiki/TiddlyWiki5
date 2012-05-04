/*\
title: $:/core/modules/startup.js
type: application/javascript
module-type: startup

This is the main application logic for both the client and server

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

exports.startup = function() {
	var modules,n,m,f;
	// Set up additional global objects
	$tw.plugins.applyMethods("global",$tw);
	// Wire up plugin modules
	$tw.plugins.applyMethods("config",$tw.config);
	$tw.plugins.applyMethods("utils",$tw.utils);
	$tw.version = $tw.utils.extractVersionInfo();
	$tw.plugins.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.plugins.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.plugins.applyMethods("treeutils",$tw.Tree);
	$tw.plugins.applyMethods("treenode",$tw.Tree);
	// Load up the tiddlers in the root of the core directory
	if(!$tw.isBrowser) {
		$tw.plugins.loadPlugins($tw.boot.bootPath,"$:/core",/^\.DS_Store$|.meta$|^modules$/);
	}
	// Set up the wiki store
	$tw.wiki.initMacros();
	$tw.wiki.initEditors();
	$tw.wiki.initParsers();
	// Set up the command plugins
	$tw.Commander.initCommands();

if($tw.isBrowser) {
	var renderer = $tw.wiki.parseTiddler("PageTemplate");
	renderer.execute([],"PageTemplate");
	renderer.renderInDom(document.body);
	$tw.wiki.addEventListener("",function(changes) {
		renderer.refreshInDom(changes);
	});
	console.log("$tw",$tw);
} else {
	var commander = new $tw.Commander(
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

}

})();
