/*\
title: $:/core/modules/widgets/action-log.js
type: application/javascript
module-type: widget

Action widget to log debug messages

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const LogWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LogWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LogWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

LogWidget.prototype.execute = function() {
	this.message = this.getAttribute("$$message","debug");
	this.logAll = this.getAttribute("$$all","no") === "yes";
	this.filter = this.getAttribute("$$filter");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
LogWidget.prototype.refresh = function(changedTiddlers) {
	this.refreshSelf();
	return true;
};

/*
Invoke the action associated with this widget
*/
LogWidget.prototype.invokeAction = function(triggeringWidget,event) {
	this.log();
	return true; // Action was invoked
};

LogWidget.prototype.log = function() {
	const data = {};
	let dataCount;
	const allVars = {};
	let filteredVars;

	$tw.utils.each(this.attributes,(attribute,name) => {
		if(name.substring(0,2) !== "$$") {
			data[name] = attribute;
		}
	});

	for(const v in this.variables) {
		const variable = this.parentWidget && this.parentWidget.variables[v];
		if(variable && variable.isFunctionDefinition) {
			allVars[v] = variable.value;
		} else {
			allVars[v] = this.getVariable(v,{defaultValue: ""});
		}
	}
	if(this.filter) {
		filteredVars = this.wiki.compileFilter(this.filter).call(this.wiki,this.wiki.makeTiddlerIterator(allVars));
		$tw.utils.each(filteredVars,(name) => {
			data[name] = allVars[name];
		});
	}
	dataCount = $tw.utils.count(data);

	console.group(this.message);
	if(dataCount > 0) {
		$tw.utils.logTable(data);
	}
	if(this.logAll || !dataCount) {
		console.groupCollapsed("All variables");
		$tw.utils.logTable(allVars);
		console.groupEnd();
	}
	console.groupEnd();
};

exports["action-log"] = LogWidget;
