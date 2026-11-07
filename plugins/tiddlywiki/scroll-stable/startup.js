/*\
title: $:/plugins/tiddlywiki/scroll-stable/startup.js
type: application/javascript
module-type: startup

Registers a story-wrapper behaviour that keeps the story river's scroll position stable across
resizes, via the core story-wrapper widget's `th-story-wrapper-dom` hook.

\*/

"use strict";

exports.name = "scroll-stable";
exports.platforms = ["browser"];
// Must register before the first render; the story-wrapper fires th-story-wrapper-dom once at render.
exports.before = ["render"];
exports.synchronous = true;

var ScrollStability = require("$:/plugins/tiddlywiki/scroll-stable/stability.js").ScrollStability;

exports.startup = function() {
	$tw.hooks.addHook("th-story-wrapper-dom",function(domNode,widget) {
		var controller = new ScrollStability(domNode,widget);
		if(typeof widget.registerBehaviour === "function") {
			widget.registerBehaviour(controller);
		}
		return domNode;
	});
};
