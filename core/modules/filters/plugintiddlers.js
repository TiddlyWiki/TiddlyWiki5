/*\
title: $:/core/modules/filters/plugintiddlers.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the titles of the shadow tiddlers within a plugin

\*/

"use strict";

/*
Export our filter function
*/
exports.plugintiddlers = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var pluginInfo = options.wiki.getPluginInfo(title) || options.wiki.getTiddlerDataCached(title,{tiddlers:[]});
		if(pluginInfo && pluginInfo.tiddlers) {
			$tw.utils.each(pluginInfo.tiddlers,function(fields,title) {
				results.push(title);
			});
		}
	});
	results.sort();
	return results;
};
