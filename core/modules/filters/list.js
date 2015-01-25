/*\
title: $:/core/modules/filters/list.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddlers whose title is listed in the operand tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.list = function(source,operator,options) {
	var c,
		results = [],
		neg = "!" === operator.prefix,
		tr = $tw.utils.parseTextReference(operator.operand),
		currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler"),
		list = options.wiki.getTiddlerList(tr.title || currTiddlerTitle,tr.field,tr.index);
	source(function(tiddler,title) {
		var i = list.indexOf(title);
		if(neg && i === -1 || !neg && i > -1){
			results.push(title);
		}
	});
	return results;
};

})();
