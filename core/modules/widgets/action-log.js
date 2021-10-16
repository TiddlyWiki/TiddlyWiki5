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

var LogWidget = function(parseTreeNode,options) {
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

LogWidget.prototype.execute = function(){
	this.message = this.getAttribute("$$message","debug");
	this.logAll = this.getAttribute("$$all","no") === "yes" ? true : false;
	this.filter = this.getAttribute("$$filter");
}

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
	var data = {},
		dataCount,
		allVars = {},
		filteredVars;

	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.substring(0,2) !== "$$") {
			data[name] = attribute;
		}
	});

	for(var v in this.variables) {
		allVars[v] = this.getVariable(v,{defaultValue:""});
	}
	if(this.filter) {
		filteredVars = this.wiki.compileFilter(this.filter).call(this.wiki,this.wiki.makeTiddlerIterator(allVars));
		$tw.utils.each(filteredVars,function(name) {
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
}

exports["action-log"] = LogWidget;

})();
