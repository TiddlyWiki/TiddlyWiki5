/*\
title: $:/core/modules/filters/all/missing.js
type: application/javascript
module-type: allfilteroperator
\*/

"use strict";

exports.missing = function(source,prefix,options) {
	return options.wiki.getMissingTitles();
};
