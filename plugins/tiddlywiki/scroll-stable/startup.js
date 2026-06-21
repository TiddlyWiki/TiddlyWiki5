/*\
title: $:/plugins/tiddlywiki/scroll-stable/startup.js
type: application/javascript
module-type: startup

Registers a story-wrapper behaviour that keeps the story river's scroll position stable across
resizes. Hooks into the core `story-wrapper` widget via its `th-story-wrapper-dom` extension point;
because hooks run every registered handler, this composes with any other plugins that attach to the
same wrapper.

\*/

"use strict";

exports.name = "scroll-stable";
exports.platforms = ["browser"];
exports.after = ["render"];
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
