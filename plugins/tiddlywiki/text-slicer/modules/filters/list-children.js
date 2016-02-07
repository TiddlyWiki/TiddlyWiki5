/*\
title: $:/core/modules/filters/list-children.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the descendents of a tiddler listed in the "list" field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["list-children"] = function(source,operator,options) {
	var children = {},
		processTiddler = function(title) {
			var tiddler = options.wiki.getTiddler(title);
			if(tiddler && !$tw.utils.hop(children,title)) {
				children[title] = true;
				var list = options.wiki.getTiddlerList(title,operator.operand);
				list.forEach(function(listItem) {
					if(!$tw.utils.hop(children,listItem)) {
						processTiddler(listItem);
					}
				});
			}
		};
	source(function(tiddler,title) {
		processTiddler(title);
	});
	return Object.keys(children);
};

})();
