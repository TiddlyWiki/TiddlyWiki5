/* eslint-disable no-unused-vars */
/*\
title: $:/core/modules/widgets/action-log.js
type: application/javascript
module-type: widget

Action widget to log debug messages

\*/

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
	var self = this,
		data = {}, // Hashmap by attribute name with string or array of string values
		dataCount,
		allVars = {}, // Hashmap by variable name with string or array of string values
		filteredVars;
	// Collect the attributes to be logged
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(name.substring(0,2) !== "$$") {
			var resultList = self.computeAttribute(attribute,{asList: true});
			if(resultList.length === 1) {
				data[name] = resultList[0];
			} else {
				data[name] = resultList;
			}
		}
	});
	// Collect values of all variables, using the source text for functions
	for(var v in this.variables) {
		var variable = this.parentWidget && this.parentWidget.variables[v];
		if(variable && variable.isFunctionDefinition) {
			allVars[v] = variable.value;
		} else {
			var variableInfo = this.getVariableInfo(v);
			allVars[v] = variableInfo.resultList.length === 1 ? variableInfo.text : variableInfo.resultList;
		}
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
		this.logVariables(data);
	}
	if(this.logAll || !dataCount) {
		console.groupCollapsed("All variables");
		this.logVariables(allVars);
		console.groupEnd();
	}
	console.groupEnd();
};

/*
Log variables with multi-valued variables shown in nested groups
*/
LogWidget.prototype.logVariables = function(vars) {
	var tableData = {},
		multiValuedDetails = [],
		includesStandardVariables = false;

	// Build table data, using placeholders for multi-valued variables
	$tw.utils.each(vars,function(value,name) {
		if(Array.isArray(value)) {
			if(value.length === 0) {
				tableData[name] = "[Array: empty]";
			} else {
				tableData[name] = "[Array: " + value.length + " values (see below)]";
				multiValuedDetails.push({name: name, values: value});
			}
		} else {
			tableData[name] = value;
			includesStandardVariables = true;
		}
	});

	// Show the main table only if there are standard variables
	if(includesStandardVariables) {
		console.table(tableData);
	}

	// Show detailed nested groups for multi-valued variables
	multiValuedDetails.forEach(function(item) {
		console.groupCollapsed(item.name + " (" + item.values.length + " values)");
		console.table(item.values);
		console.groupEnd();
	});
};

exports["action-log"] = LogWidget;
