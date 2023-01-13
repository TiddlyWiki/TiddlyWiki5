/*\
title: $:/core/modules/startup/info.js
type: application/javascript
module-type: startup

Initialise $:/info tiddlers via $:/temp/info-plugin pseudo-plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "info";
exports.before = ["startup"];
exports.after = ["load-modules"];
exports.synchronous = true;

var TITLE_INFO_PLUGIN = "$:/temp/info-plugin";

exports.startup = function() {
	// Function to bake the info plugin with new tiddlers
	var updateInfoPlugin = function(tiddlerFieldsArray) {
		// Get the existing tiddlers
		var json = $tw.wiki.getTiddlerData(TITLE_INFO_PLUGIN,{tiddlers: {}});
		// Add the new ones
		$tw.utils.each(tiddlerFieldsArray,function(fields) {
			if(fields && fields.title) {
				json.tiddlers[fields.title] = fields;
			}
		});
		// Bake the info tiddlers into a plugin. We use the non-standard plugin-type "info" because ordinary plugins are only registered asynchronously after being loaded dynamically
		var fields = {
			title: TITLE_INFO_PLUGIN,
			type: "application/json",
			"plugin-type": "info",
			text: JSON.stringify(json,null,$tw.config.preferences.jsonSpaces)
		};
		$tw.wiki.addTiddler(new $tw.Tiddler(fields));

	};
	// Collect up the info tiddlers
	var tiddlerFieldsArray = [];
	// Give each info module a chance to provide as many info tiddlers as they want as an array, and give them a callback for dynamically updating them
	$tw.modules.forEachModuleOfType("info",function(title,moduleExports) {
		if(moduleExports && moduleExports.getInfoTiddlerFields) {
			Array.prototype.push.apply(tiddlerFieldsArray,moduleExports.getInfoTiddlerFields(updateInfoPlugin));
		}
	});
	updateInfoPlugin(tiddlerFieldsArray);
	var changes = $tw.wiki.readPluginInfo([TITLE_INFO_PLUGIN]);
	$tw.wiki.registerPluginTiddlers("info",[TITLE_INFO_PLUGIN]);
	$tw.wiki.unpackPluginTiddlers();
};

})();
