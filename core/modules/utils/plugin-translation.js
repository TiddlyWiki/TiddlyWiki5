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

exports.moveActiveTranslations = function(shadowTiddlers,pluginTitle,constituentTiddlers) {
	// Define the source and target namespaces
	var sourceNamespace = pluginTitle + "languages/";
	var targetNamespace = pluginTitle + "language/";
	
	// Function to extract tiddlers from a source namespace to the target namespace
	function extractTiddlers(sourcePath) {
		$tw.utils.each(constituentTiddlers, function(tiddler) {
			if(tiddler.title.startsWith(sourceNamespace)) {
				var newTitle = title.replace(sourcePath, targetNamespace);
				$tw.wiki.addTiddler(new $tw.Tiddler(tiddler, { title: newTitle }));
			}
		});
	}

	// Step 1: Extract default language tiddlers (en-GB) from the sourceNamespace
	extractTiddlers(sourceNamespace + "en-GB/");

	// Step 2: Check the $:/language tiddler
	var selectedLanguage = $tw.wiki.getTiddlerText("$:/language");
	if (selectedLanguage) {
		// Step 3: Extract tiddlers for the selected language
		extractTiddlers(sourceNamespace + selectedLanguage + "/");
	}

	// Step 4: Resolve dependents and extract them in reverse order
	function resolveDependents(pluginTitle) {
		var pluginTiddler = $tw.wiki.getTiddler(pluginTitle);
		if (pluginTiddler) {
			var dependents = $tw.utils.parseStringArray(pluginTiddler.fields.dependents || "");
			dependents.reverse().forEach(function(dependent) {
				extractTiddlers(sourceNamespace + dependent + "/");
				resolveDependents(dependent);
			});
		}
	}

	// Step 5: Resolve dependents for the selected language
	if (selectedLanguage) {
		resolveDependents(selectedLanguage);
	}
};

})();