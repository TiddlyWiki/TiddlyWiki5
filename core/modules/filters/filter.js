/*\
title: $:/core/modules/filters/filter.js
type: application/javascript
module-type: filteroperator

Filters tiddlers based on a filter expression given in the operand.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export filter function
*/
exports.filter = function(source,operator,options) {
	var matches, parent, pass, all, variable, value,
		input=[], results = [];

	$tw.utils.each(
		(operator.suffix || "").split(" "),
		function(s) {
			if(s) {
				if(s.substr(0,1) === "$"){
					if(s.substr(1) === "all"){
						all = true;
					} else {
						pass = true;
					}
				} else {
					variable = s;
				}
			}
		}
	);

	if(variable || pass) {
		parent = options.widget && options.widget.parentWidget ? options.widget.parentWidget : null;
		value = parent ? parent.getVariable(variable) : null;
		source(function(tiddler,title) {
			if(variable && parent) {
				parent.setVariable(variable,title);
			}
			matches = $tw.wiki.filterTiddlers(
				operator.operand,
				options.widget,
				[title]
			);
			if(matches.length) {
				if(pass) {
					results.push(title);
				} else {
					$tw.utils.each(matches, function(t) {
						if(results.indexOf(t) < 0) {
							results.push(t);
						}
					});
				}
			}
		});
		if(value !== null && parent) {
			parent.setVariable(variable, value);
		}
	}
	if(!variable && !pass) {
		results = $tw.wiki.filterTiddlers(operator.operand,options.widget,source);
	}
	if(all) {
		source(function(tiddler,title) {
			input.push(title);
		});
		if(results.length) {
			results = input;
		} else {
			results = [];
		}
	}
	return results;
};

})();