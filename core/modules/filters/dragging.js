/*\
title: $:/core/modules/filters/dragging.js
type: application/javascript
module-type: filteroperator

Filter operator returning whether a drag and drop operation is in progress

\*/

"use strict";

exports.dragging = function(source,operator,options) {
	return [$tw.dragInProgress ? "yes" : "no"];
};
