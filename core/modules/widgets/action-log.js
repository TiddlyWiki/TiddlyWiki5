/*\
title: $:/core/modules/widgets/action-log.js
type: application/javascript
module-type: widget

Action widget to log debug messages

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionLogWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionLogWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionLogWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

ActionLogWidget.prototype.execute = function(){
	this.message = this.getAttribute("$$message","debug");
	this.logAll = this.getAttribute("$$all","no") === "yes" ? true : false;
	this.filter = this.getAttribute("$$filter");
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
ActionLogWidget.prototype.refresh = function(changedTiddlers) {
	this.refreshSelf();
	return true;
};

/*
Invoke the action associated with this widget
*/
ActionLogWidget.prototype.invokeAction = function(triggeringWidget,event) {
	this.log();
	return true; // Action was invoked
};

ActionLogWidget.prototype.log = function() {
	var data = {},
		dataCount,
		allVars = {},
		filteredVariables,
		self = this;

	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.substring(0,2) !== "$$") {
			data[name] = attribute;
		}		
	});

	for(var v in this.variables) {
		allVars[v] = this.getVariable(v,{defaultValue:""});
	}	
	if(this.filter) {
		filteredVariables = this.wiki.compileFilter(this.filter).call(this.wiki,this.wiki.makeTiddlerIterator(allVars));
		$tw.utils.each(filteredVariables,function(name) {
			data[name] = allVars[name];
		});		
	}
	dataCount = $tw.utils.count(data);

	console.group(this.message);
	if(dataCount > 0) {
		$tw.utils.logTable(data,["name","value"]);
	}
	if(this.logAll || !dataCount) {
		console.groupCollapsed("All variables");
		$tw.utils.logTable(allVars,["name","value"]);
		console.groupEnd();
	}
	console.groupEnd();
}

exports["action-log"] = ActionLogWidget;

})();
