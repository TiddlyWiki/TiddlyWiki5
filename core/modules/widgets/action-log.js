/*\
title: $:/core/modules/widgets/action-log.js
type: application/javascript
module-type: widget

Action widget to log debug messages

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class LogWidget extends Widget {
	constructor(parseTreeNode, options) {
		super();
		this.initialise(parseTreeNode, options);
	}
	/*
	Render this widget into the DOM
	*/
	render(parent, nextSibling) {
		this.computeAttributes();
		this.execute();
	}
	execute() {
		this.message = this.getAttribute("$$message", "debug");
		this.logAll = this.getAttribute("$$all", "no") === "yes" ? true : false;
		this.filter = this.getAttribute("$$filter");
	}
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	refresh(changedTiddlers) {
		this.refreshSelf();
		return true;
	}
	/*
	Invoke the action associated with this widget
	*/
	invokeAction(triggeringWidget, event) {
		this.log();
		return true; // Action was invoked
	}
	log() {
		var data = {}, dataCount, allVars = {}, filteredVars;

		$tw.utils.each(this.attributes, function (attribute, name) {
			if (name.substring(0, 2) !== "$$") {
				data[name] = attribute;
			}
		});

		for (var v in this.variables) {
			var variable = this.parentWidget && this.parentWidget.variables[v];
			if (variable && variable.isFunctionDefinition) {
				allVars[v] = variable.value;
			} else {
				allVars[v] = this.getVariable(v, { defaultValue: "" });
			}
		}
		if (this.filter) {
			filteredVars = this.wiki.compileFilter(this.filter).call(this.wiki, this.wiki.makeTiddlerIterator(allVars));
			$tw.utils.each(filteredVars, function (name) {
				data[name] = allVars[name];
			});
		}
		dataCount = $tw.utils.count(data);

		console.group(this.message);
		if (dataCount > 0) {
			$tw.utils.logTable(data);
		}
		if (this.logAll || !dataCount) {
			console.groupCollapsed("All variables");
			$tw.utils.logTable(allVars);
			console.groupEnd();
		}
		console.groupEnd();
	}
}

exports["action-log"] = LogWidget;
