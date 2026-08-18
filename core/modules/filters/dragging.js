/*\
title: $:/core/modules/filters/dragging.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.dragging = function(source,operator,options) {
	return [$tw.dragInProgress ? "yes" : "no"];
};
