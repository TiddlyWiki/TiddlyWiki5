/*\
title: $:/core/modules/utils/utils-format.js
type: application/javascript
module-type: utils

Various static utility functions.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.formatVariableString = function(template,options) {
	var result = "",
		firstLine = "",
		name = options.name || "",
		params = options.params || "",
		os = options.srcVariable || options.name;
	var	type = (os.isFunctionDefinition) ? "\\\\function" : (os.isMacroDefinition) ? "\\\\define" :
			(os.isProcedureDefinition) ? "\\\\procedure" : (os.isWidgetDefinition) ? "\\\\widget" : "",
		varType = (os.isFunctionDefinition) ? "fn" : (os.isMacroDefinition) ? "macro" :
			(os.isProcedureDefinition) ? "proc" : (os.isWidgetDefinition) ? "widget" : "var";
		var t = (!os.isFunctionDefinition && !os.isMacroDefinition && !os.isProcedureDefinition && !os.isWidgetDefinition) ? "$name$" : template;
		var matches = [
			[/^\$type\$/i, function() {
				return (type) ? type : "";
			}],
			[/^\$name\$/i, function() {
				return name;
			}],
			[/^\$params\$/i, function() {
				var elements = [],
					paramString = "";
				if(params && params[0] && params[0].name) {
					$tw.utils.each(params, function(p) {
						elements.push(p.name + ((p.default) ? ':"' + p.default + '"' : ""));
					});
					paramString = elements.join(", ");
				}
				// return (type) ? "(" + paramString  + ")" : "";
				return (type) ? paramString : "";
			}],
			[/^\$firstLine\$/i, function() {
				var lines = os.value.split("\n"),
					suffix = (lines.length > 1) ? "..." : "";
				return (os.isFunctionDefinition) ? lines[0].replace("\\", "\\\\") + suffix: "";
			}],
			[/^\$varType\$/i, function() {
				return varType;
			}]
		];
		while(t.length){
			var matchString = "";
			$tw.utils.each(matches, function(m) {
				var match = m[0].exec(t);
				if(match) {
					matchString = m[1].call(null,match);
					t = t.substr(match[0].length);
					return false;
				}
			});
			if(matchString) {
				result += matchString;
			} else {
				result += t.charAt(0);
				t = t.substr(1);
			}
		}
		result = result.replace(/\\(.)/g,"$1");
		return result.trim();
};
