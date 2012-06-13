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
	// This should be somewhere else
	if($tw.browser) {
		$tw.browser.unHyphenateCss = document.body.style["background-color"] === undefined;
		$tw.browser.prefix = document.body.style.webkitTransform !== undefined ? "webkit" : 
							document.body.style.MozTransform !== undefined ? "Moz" :
							document.body.style.OTransform !== undefined ? "O" : null;
		$tw.browser.transition = $tw.browser.prefix + "Transition";
		$tw.browser.transform = $tw.browser.prefix + "Transform";
		$tw.browser.transformorigin = $tw.browser.prefix + "TransformOrigin";
	}
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
	// Set up the wiki store
	$tw.wiki.initMacros();
	$tw.wiki.initEditors();
	$tw.wiki.initStoryViews();
	$tw.wiki.initParsers();
	// Set up the command plugins
	$tw.Commander.initCommands();
	// Host-specific startup
	if($tw.browser) {
		// Install the popup zapper
		document.body.addEventListener("click",function(event) {
			// Is the click within a popup?
			var inPopup = false,
				e = event.target;
			while(e !== document) {
				if($tw.utils.hasClass(e,"tw-popup")) {
					inPopup = true;
				}
				e = e.parentNode;
			}
			// If we're not in a popup, then send out an event to cancel all popups
			if(!inPopup) {
				var cancelPopupEvent = document.createEvent("Event");
				cancelPopupEvent.initEvent("tw-cancel-popup",true,true);
				cancelPopupEvent.targetOfCancel = event.target;
				var controllers = document.querySelectorAll(".tw-popup-controller");
				for(var t=0; t<controllers.length; t++) {
					controllers[t].dispatchEvent(cancelPopupEvent);
				}
			}
		});
		// Display the PageTemplate
		var template = "$:/templates/PageTemplate",
			renderer = $tw.wiki.parseTiddler(template);
		renderer.execute([],template);
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
