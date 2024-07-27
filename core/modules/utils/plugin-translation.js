/*\
title: $:/core/modules/utils/plugin-translation.js
type: application/javascript
module-type: utils

Move active translations from a plugin's `/languages` path to the `/language` path.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.activatePluginTranslations = function(shadowTiddlers,pluginTitle,constituentTiddlers) {
	// Define the source and target namespaces
	var sourceNamespace = pluginTitle + "/languages/";
	var targetNamespace = pluginTitle + "/language/";
	// Function to extract tiddlers from a source namespace to the target namespace
	function extractTiddlers(sourcePath) {
		$tw.utils.each(constituentTiddlers,function(tiddler) {
			if($tw.utils.startsWith(tiddler.title,sourcePath)) {
				var newTitle = tiddler.title.replace(sourcePath, targetNamespace);
				shadowTiddlers[newTitle] = {
					source: pluginTitle,
					tiddler: new $tw.Tiddler(tiddler,{title: newTitle})
				};
			}
		});
	}

	// Step 1: Extract default language tiddlers (en-GB) from the sourceNamespace
	extractTiddlers(sourceNamespace + "en-GB/");

	// Step 2: Check the $:/language tiddler
	var selectedLanguagePlugin = $tw.wiki.getTiddlerText("$:/language");
	if(selectedLanguagePlugin) {
		// Step 3: Extract tiddlers for the selected language
		extractTiddlers(sourceNamespace + selectedLanguagePlugin.replace('$:/languages/','') + "/");
	}

	// Step 4: Resolve dependents and extract them in reverse order
	function resolveDependents(pluginTitle) {
		var pluginTiddler = $tw.wiki.getTiddler(pluginTitle);
		if(pluginTiddler) {
			var dependents = $tw.utils.parseStringArray(pluginTiddler.fields.dependents || "");
			$tw.utils.each(dependents.reverse(),function(dependent) {
				extractTiddlers(sourceNamespace + dependent + "/");
				resolveDependents(dependent);
			});
		}
	}

	// Step 5: Resolve dependents for the selected language
	if(selectedLanguagePlugin) {
		resolveDependents(selectedLanguagePlugin);
	}
};

})();