/*\
title: $:/core/modules/startup/startup-actions.js
type: application/javascript
module-type: startup

This runs startup action scripts

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	// Export name and synchronous status
	exports.name = "startup-actions";
	exports.platforms = ["browser"];
	exports.after = ["rootwidget"];
	exports.synchronous = true;

	exports.startup = function() {
		// Do all actions on startup.
		var tiddlersFilter = "[tag[$:/tags/StartupAction]!has[draft.of]]";
		var expressionTiddlerList = $tw.wiki.filterTiddlers(tiddlersFilter);
		if(expressionTiddlerList.length !== 0) {
			for (var j = 0; j < expressionTiddlerList.length; j++) {
				var expressionTiddler = $tw.wiki.getTiddler(expressionTiddlerList[j]);
				if(expressionTiddler) {
					evaluateExpression(expressionTiddler);
				}
			}
		}
	};

	function evaluateExpression(expressionTiddler) {
		if(expressionTiddler) {
			// Import all the variables because the widget isn't part of the main tiddlywiki story so the global macros and similar things aren't loaded by default.
			var stringPassed = "<$importvariables filter='[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]] [[" + expressionTiddler.getFieldString("title") + "]]'>"+expressionTiddler.getFieldString("text")+"</$importvariables>";
			var parsed = $tw.wiki.parseText("text/vnd.tiddlywiki", stringPassed, {});
			var widgets = $tw.wiki.makeWidget(parsed, {parentWidget:$tw.rootWidget});
			var container = $tw.fakeDocument.createElement("div");

			// If a filter is given for the action tiddlers do the actions in each returned tiddler in sequence.
			if(expressionTiddler.getFieldString("action_filter")) {
				var actionTiddlerList = $tw.wiki.filterTiddlers(expressionTiddler.getFieldString("action_filter"));
				for (var k = 0; k < actionTiddlerList.length; k++) {
					performAction(actionTiddlerList[k], widgets, container);
				}
			} else {
				// If no filter for the action tiddlers is given just evaluate the expressions.
				var expressionTiddlerTitle = expressionTiddler.getFieldString("title");
				performAction(expressionTiddlerTitle, widgets, container);
			}
		}
	}

	// Invoke the action(s).
	function performAction(tiddler, widgets, container) {
		widgets.setVariable("currentTiddler", tiddler);
		widgets.render(container, null);
		if(widgets) {
			widgets.invokeActions({});
		}
	}

})();
