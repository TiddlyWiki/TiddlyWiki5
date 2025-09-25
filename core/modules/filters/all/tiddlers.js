/*\
title: $:/core/modules/filters/all/tiddlers.js
type: application/javascript
module-type: allfilteroperator

Filter function for [all[tiddlers]]

\*/

"use strict";

/*
Export our filter function
*/
exports.tiddlers = function(source,prefix,options) {
	return options.wiki.allTitles();
};
