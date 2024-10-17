/*\
title: $:/core/modules/language.js
type: application/javascript
module-type: global

The $tw.Language() manages translateable strings

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Create an instance of the language manager. Options include:
wiki: wiki from which to retrieve translation tiddlers
*/
function Language(options) {
	options = options || "";
	this.wiki = options.wiki || $tw.wiki;
}

/*
Return a wikified translateable string. The title is automatically prefixed with "$:/language/"
Options include:
variables: optional hashmap of variables to supply to the language wikification
*/
Language.prototype.getString = function(title,options) {
	options = options || {};
	title = "$:/language/" + title;
	return this.wiki.renderTiddler("text/plain",title,{variables: options.variables});
};

/*
Return a raw, unwikified translateable string. The title is automatically prefixed with "$:/language/"
*/
Language.prototype.getRawString = function(title) {
	title = "$:/language/" + title;
	return this.wiki.getTiddlerText(title);
};

// Extract active translations shadow tiddlers from a plugin's `/languages` path to the `/language` path.
Language.prototype.activatePluginTranslations = function(shadowTiddlers,pluginTitle,constituentTiddlers) {
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
				if(!$tw.wiki.getPluginInfo(parts[0]) || !parts[1]) return;
				// Check if the language to patch is the selected language
				var languageToPatch = parts[1].split("/")[0];
				if(language !== languageToPatch) return;
				var newTitle = tiddler.title.replace("/languages/" + languageToPatch, "/language");
				shadowTiddlers[newTitle] = {
					source: pluginTitle,
					tiddler: new $tw.Tiddler(tiddler,{title: newTitle})
				};
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

exports.Language = Language;

})();
