/*\
title: $:/core/modules/filters/interleave.js
type: application/javascript
module-type: filteroperator

Interleave two or more lists one item at a time

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	/*
	Interleave two or more lists
	*/
	exports.interleave = function(source,operator,options) {
		var allowDuplicates = false;
		switch(operator.suffix) {
			case "raw":
				allowDuplicates = true;
				break;
			case "dedupe":
				allowDuplicates = false;
				break;
		}
		var results = new $tw.utils.LinkedList();
		var pushResult = allowDuplicates ? results.push.bind(results) : results.pushTop.bind(results);

		// Alternately, could use the following function definition instead:
		// function pushResult(item) {
		// 	if(allowDuplicates) {
		// 		results.push(item);
		// 	} else {
		// 		results.pushTop(item);
		// 	}
		// }

		var input = [];
		source(function(tiddler,title) {
			input.push(title);
		});
		var lists = [input];
		operator.operands.forEach(function(operand) {
			var list = $tw.utils.parseStringArray(operand,true);
			lists.push(list);
		});
		var listCount = lists.length;
		var indices = new Array(listCount);
		var remaining = new Array(listCount);
		lists.forEach(function(list,index) {
			indices[index] = 0;
			remaining[index] = (list.length > 0);
		});

		var current = 0;
		while(remaining.some(Boolean)) {
			var list = lists[current];
			var index = indices[current];
			if(remaining[current]) {
				pushResult(list[index]);
				if(index+1 < list.length) {
					indices[current] = index+1;
				} else {
					remaining[current] = false;
				}
			}
			current = (current+1) % listCount;
		}

		return results.makeTiddlerIterator(options.wiki);
	};

})();
