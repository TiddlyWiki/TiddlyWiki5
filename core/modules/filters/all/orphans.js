/*\
title: $:/core/modules/filters/all/orphans.js
type: application/javascript
module-type: allfilteroperator
\*/

"use strict";

exports.orphans = function(source,prefix,options) {
	return options.wiki.getOrphanTitles();
};
