/*\
title: $:/core/modules/filters/index.js
type: application/javascript
module-type: filteroperator

returns the value at a given index of a datatiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.index = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var parser,
			index = operator.operand,
			title = tiddler ? tiddler.fields.title : title,
			data = options.wiki.getTiddlerData(tiddler);
		if(index && data) {
			parser = options.wiki.parseTextReference(title,"",index,{});
			if(parser) {
				results.push(parser.source);
			}
		}
	});
	return results;
};

})();