/*\
title: $:/core/startup.js
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
	$tw.applyPluginMethods("global",$tw);
	// Wire up plugin modules
	$tw.applyPluginMethods("config",$tw.config);
	$tw.applyPluginMethods("utils",$tw.utils);
	$tw.applyPluginMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.applyPluginMethods("wikimethod",$tw.Wiki.prototype);
	$tw.applyPluginMethods("treeutils",$tw.Tree);
	$tw.applyPluginMethods("treenode",$tw.Tree);
	// Set up the wiki store
	$tw.wiki.initMacros();
	$tw.wiki.initEditors();
	$tw.wiki.initParsers();

if($tw.isBrowser) {
	var renderer = $tw.wiki.parseTiddler("PageTemplate");
	renderer.execute([],"PageTemplate");
	renderer.renderInDom(document.body);
	$tw.wiki.addEventListener("",function(changes) {
		renderer.refreshInDom(changes);
	});
	console.log("$tw",$tw);
} else {
	console.log("$tw",require("util").inspect($tw,false,8));
}


}

})();
