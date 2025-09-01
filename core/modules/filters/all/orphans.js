/*\
title: $:/core/modules/filters/all/orphans.js
type: application/javascript
module-type: allfilteroperator

Filter function for [all[orphans]]

\*/

"use strict";

/*
Export our filter function
*/
exports.orphans = function(source,prefix,options) {
	return options.wiki.getOrphanTitles();
};
