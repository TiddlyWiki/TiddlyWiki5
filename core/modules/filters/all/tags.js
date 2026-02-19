/*\
title: $:/core/modules/filters/all/tags.js
type: application/javascript
module-type: allfilteroperator
\*/

"use strict";

exports.tags = function(source,prefix,options) {
	return Object.keys(options.wiki.getTagMap());
};
