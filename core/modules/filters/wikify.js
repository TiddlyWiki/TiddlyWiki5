/*\
title: $:/core/modules/filters/wikify.js
type: application/javascript
module-type: filteroperator

Filter operator wikifying each string in the input list and returning the result as a list of strings

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.wikify = function(source,operator,options) {
	var output = operator.operands[0],
		mode = operator.operands[1],
		type = operator.operands[2],
		results = [];
	source(function(tiddler,title) {
		var wikifier = new $tw.utils.Wikifier({
			wiki: options.wiki,
			widget: options.widget,
			text: title,
			type: type,
			mode: mode,
			output: output
		});
		results.push(wikifier.getResult());
	});
	return results;
};

})();
