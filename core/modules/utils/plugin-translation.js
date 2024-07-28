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
	var sourcePath = pluginTitle + "/languages/";
	var targetPath = pluginTitle + "/language/";
	// Check the $:/language tiddler
	var selectedLanguagePlugin = $tw.wiki.getTiddlerText("$:/language");
	var language = selectedLanguagePlugin.replace("$:/languages/","");
	// Function to extract tiddlers from a source namespace to the target namespace
	function extractLanguageTiddlers(sourcePath) {
		$tw.utils.each(constituentTiddlers,function(tiddler) {
			if($tw.utils.startsWith(tiddler.title,sourcePath)) {
				var newTitle = tiddler.title.replace(sourcePath, targetPath);
				shadowTiddlers[newTitle] = {
					source: pluginTitle,
					tiddler: new $tw.Tiddler(tiddler,{title: newTitle})
				};
			} else if(!$tw.utils.startsWith(tiddler.title,pluginTitle) && tiddler.title.includes("/languages/")) {
				// Allow patch other plugin's translation.
				var parts = tiddler.title.split("/languages/");
				if($tw.wiki.getPluginInfo(parts[0]) && parts[1]) {
					// Check if the language to patch is the selected language
					var languageToPatch = parts[1].split("/")[0];
					if(language !== languageToPatch) return;
					var newTitle = tiddler.title.replace("/languages/" + languageToPatch, "/language");
					shadowTiddlers[newTitle] = {
						source: pluginTitle,
						tiddler: new $tw.Tiddler(tiddler,{title: newTitle})
					};
				}
			}
		});
	}

	// Extract fallback language tiddlers (en-GB) from the sourceNamespace
	extractLanguageTiddlers(sourcePath + "en-GB/");

	// Resolve dependents and extract them in reverse order
	function resolveLanguageDependents(languagePluginTitle) {
		var languagePlugin = $tw.wiki.getTiddler(languagePluginTitle);
		if(languagePlugin) {
			var dependents = $tw.utils.parseStringArray(languagePlugin.fields.dependents || "");
			$tw.utils.each(dependents,function(dependent) {
				// Resolve dependents for the selected language, extract as fallback
				resolveLanguageDependents(dependent);
				// Extract translation tiddlers for the selected language
				var dependentLanguage = dependent.replace("$:/languages/","");
				extractLanguageTiddlers(sourcePath + dependentLanguage + "/");
			});
		}
	}
	
	if(selectedLanguagePlugin) {
		resolveLanguageDependents(selectedLanguagePlugin);
		extractLanguageTiddlers(sourcePath + language + "/");
	}
};

})();
