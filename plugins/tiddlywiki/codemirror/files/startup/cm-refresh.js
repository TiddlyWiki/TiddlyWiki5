/*\
title: $:/plugins/tiddlywiki/codemirror/modules/startup/cm-refresh.js
type: application/javascript
module-type: startup

Intercept an input's refresh cycle and update CM's options if necessary

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "cm-refresh";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

exports.startup = function() {

	$tw.hooks.addHook("th-refreshing-input",function(widget,editInfo,changedTiddlers,changedAttributes) {
		if(widget.engine.refreshCodeMirrorOptions) {
			widget.engine.refreshCodeMirrorOptions(changedTiddlers);
		}
	});

})();
