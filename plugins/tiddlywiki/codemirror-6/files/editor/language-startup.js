/*\
title: $:/plugins/tiddlywiki/codemirror-6/language-startup.js
type: application/javascript
module-type: startup

Discovers all codemirror6-plugin modules at startup and calls their
registerLanguage() method to register languages for nested code blocks.

This runs before render to ensure languages are available for syntax
highlighting in TiddlyWiki code blocks.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "cm6-language-startup";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

var PLUGIN_MODULE_TYPE = "codemirror6-plugin";

exports.startup = function() {
	var core;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage) {
		return;
	}

	// Discover all codemirror6-plugin modules and call registerLanguage if present
	// IMPORTANT: lang-tiddlywiki must be called LAST because it needs all other
	// languages to be registered first (for nested code block highlighting)
	if($tw && $tw.modules && typeof $tw.modules.forEachModuleOfType === "function") {
		var tiddlywikiPlugin = null;
		var tiddlywikiTitle = null;

		// First pass: register all non-tiddlywiki languages
		$tw.modules.forEachModuleOfType(PLUGIN_MODULE_TYPE, function(title, pluginModule) {
			try {
				var pluginDef = pluginModule.default || pluginModule.plugin || pluginModule;

				if(pluginDef && typeof pluginDef.registerLanguage === "function") {
					// Defer lang-tiddlywiki to run last
					if(pluginDef.name === "lang-tiddlywiki") {
						tiddlywikiPlugin = pluginDef;
						tiddlywikiTitle = title;
					} else {
						pluginDef.registerLanguage(core);
					}
				}
			} catch (e) {
				// Silent fail for individual plugins
			}
		});

		// Second pass: register lang-tiddlywiki last
		if(tiddlywikiPlugin) {
			try {
				tiddlywikiPlugin.registerLanguage(core);
			} catch (e) {
				// Silent fail
			}
		}
	}
};
