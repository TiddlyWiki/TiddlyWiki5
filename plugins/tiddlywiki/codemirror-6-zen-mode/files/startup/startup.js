/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/zen-mode/modules/startup.js
type: application/javascript
module-type: startup

Zen Mode startup - initializes and registers with the CM6 widget system

\*/

/*jslint node: true, browser: true */
/*global $tw: false */

"use strict";

exports.name = "cm6-zen-mode";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

exports.startup = function() {
	// Import the zen mode manager
	var ZenMode = require("$:/plugins/tiddlywiki/codemirror-6/plugins/zen-mode/zen-mode.js");
	var zenMode = ZenMode.getZenMode();

	// Store global reference
	$tw.cm6ZenMode = zenMode;

	// Register with the CM6 widget plugin system
	try {
		var editTextModule = require("$:/plugins/tiddlywiki/codemirror-6/widgets/subclasses/edit-text.js");

		if(editTextModule && editTextModule.registry) {
			editTextModule.registry.register("zenMode", {
				/**
				 * Called when an editor widget is rendered
				 */
				onRender: function(_widget) {
					// Nothing special needed on render
				},

				/**
				 * Called on widget refresh
				 */
				onRefresh: function(_widget, _changedTiddlers) {
					// Update theme on overlay if zen mode is active
					if(zenMode.isActive) {
						zenMode.updateTheme();
					}
				},

				/**
				 * Message handlers
				 */
				onMessage: {
					"tm-cm6-zen-mode": function(widget, _event) {
						if(widget.engine && widget.engine.domNode) {
							zenMode.toggle(widget.engine.domNode, widget.engine);
						}
					}
				}
			});
		}
	} catch (_e) {
		// Core plugin not loaded yet or registry not available
	}
};
