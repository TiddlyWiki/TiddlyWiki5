/*\
title: $:/core/modules/filters/unknown.js
type: application/javascript
module-type: filteroperator

Filter operator for handling unknown filter operators

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fieldFilterOperatorFn = require("$:/core/modules/filters/field.js").field;

/*
Export our filter function
*/
exports.unknown = function(source,operator,options) {
	var customDefinitionTitle = "[" + operator.operator + "[]]",
		customDefinition = options.widget && options.widget.getVariableInfo && options.widget.getVariableInfo(customDefinitionTitle);
	if(customDefinition && customDefinition.srcVariable) {
		var variables = Object.create(null);
		$tw.utils.each(customDefinition.srcVariable.variableParams,function(param,index) {
			var value = operator.operands[index];
			if(value === undefined) {
				value = param["default"] || "";
			}
			variables[param.name] = value;
		});
		var getVariable = function(name,opts) {
			if(name in variables) {
				return variables[name];
			} else {
				return options.widget.getVariable(name,opts);
			};
		};
		var getVariableInfo = function(name,opts) {
			return options.widget.getVariableInfo(name,opts);
		}
		var list = options.wiki.filterTiddlers(customDefinition.srcVariable.value,{getVariable: getVariable,getVariableInfo: getVariableInfo},source);
		if(operator.prefix === "!") {
			var results = [];
			source(function(tiddler,title) {
				if(list.indexOf(title) === -1) {
					results.push(title);
				}
			});
			return results;
		} else {
			return list;
		}
	} else {
		return fieldFilterOperatorFn(source,operator,options);
	}
};

})();
