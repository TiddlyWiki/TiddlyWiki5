/*\
title: $:/core/modules/plugins.js
type: application/javascript
module-type: startup

Startup logic concerned with managing plugins

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "plugins";
exports.after = ["load-modules"];
exports.synchronous = true;

exports.startup = function() {
	$tw.wiki.addEventListener("change",function(changes) {
		var titles = Object.keys(changes);
		// Ignore any changes to plugins with the plugin-type "import"
		for(var t=titles.length-1; t>=0; t--) {
			var title = titles[t],
				tiddler = $tw.wiki.getTiddler(title);
			if(tiddler && tiddler.fields["plugin-type"] === "import") {
				titles.splice(t,1);
			}
		}
		// Read or delete the plugin info of the changed tiddlers
		var changes = $tw.wiki.readPluginInfo(titles);
		if(changes.modifiedPlugins.length > 0 || changes.deletedPlugins.length > 0) {
			// (Re-)register any modified plugins
			$tw.wiki.registerPluginTiddlers(null,changes.modifiedPlugins);
			// Unregister any deleted plugins
			$tw.wiki.unregisterPluginTiddlers(null,changes.deletedPlugins);
			// Unpack the shadow tiddlers
			$tw.wiki.unpackPluginTiddlers();
		}
	});
};

})();
