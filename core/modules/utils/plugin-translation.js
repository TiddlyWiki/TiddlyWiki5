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

	// Extract fallback language tiddlers (en-GB) from the sourceNamespace
	extractTiddlers(sourceNamespace + "en-GB/");

	// Check the $:/language tiddler
	var selectedLanguagePlugin = $tw.wiki.getTiddlerText("$:/language");

	// Resolve dependents and extract them in reverse order
	function resolveDependents(languagePluginTitle) {
		var languagePlugin = $tw.wiki.getTiddler(languagePluginTitle);
		if(languagePlugin) {
			var dependents = $tw.utils.parseStringArray(languagePlugin.fields.dependents || "");
			$tw.utils.each(dependents,function(dependent) {
				// Resolve dependents for the selected language, extract as fallback
				resolveDependents(dependent);
				// Extract translation tiddlers for the selected language
				extractTiddlers(sourceNamespace + dependent.replace("$:/languages/","") + "/");
			});
		}
	}
	
	if(selectedLanguagePlugin) {
		resolveDependents(selectedLanguagePlugin);
		extractTiddlers(sourceNamespace + selectedLanguagePlugin.replace("$:/languages/","") + "/");
	}
};

})();
