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
	$tw.plugins.applyMethods("global",$tw);
	// Wire up plugin modules
	$tw.plugins.applyMethods("config",$tw.config);
	$tw.plugins.applyMethods("utils",$tw.utils);
	$tw.plugins.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.plugins.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.plugins.applyMethods("treeutils",$tw.Tree);
	$tw.plugins.applyMethods("treenode",$tw.Tree);
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
