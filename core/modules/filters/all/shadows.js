/*\
title: $:/core/modules/filters/all/shadows.js
type: application/javascript
module-type: allfilteroperator
\*/

"use strict";

exports.shadows = function(source,prefix,options) {
	return options.wiki.allShadowTitles();
};
