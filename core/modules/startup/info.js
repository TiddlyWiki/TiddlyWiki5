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
	// Collect up the info tiddlers
	var infoTiddlerFields = {};
	// Give each info module a chance to fill in as many info tiddlers as they want
	$tw.modules.forEachModuleOfType("info",function(title,moduleExports) {
		if(moduleExports && moduleExports.getInfoTiddlerFields) {
			var tiddlerFieldsArray = moduleExports.getInfoTiddlerFields(infoTiddlerFields);
			$tw.utils.each(tiddlerFieldsArray,function(fields) {
				if(fields) {
					infoTiddlerFields[fields.title] = fields;
				}
			});
		}
	});
	// Bake the info tiddlers into a plugin. We use the non-standard plugin-type "info" because ordinary plugins are only registered asynchronously after being loaded dynamically
	var fields = {
		title: TITLE_INFO_PLUGIN,
		type: "application/json",
		"plugin-type": "info",
		text: JSON.stringify({tiddlers: infoTiddlerFields},null,$tw.config.preferences.jsonSpaces)
	};
	$tw.wiki.addTiddler(new $tw.Tiddler(fields));
	$tw.wiki.readPluginInfo([TITLE_INFO_PLUGIN]);
	$tw.wiki.registerPluginTiddlers("info");
	$tw.wiki.unpackPluginTiddlers();
};

})();
