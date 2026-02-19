/*\
title: $:/core/modules/filters/all/tiddlers.js
type: application/javascript
module-type: allfilteroperator
\*/

"use strict";

exports.tiddlers = function(source,prefix,options) {
	return options.wiki.allTitles();
};
