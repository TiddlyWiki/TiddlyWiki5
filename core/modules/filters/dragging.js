/*\
title: $:/core/modules/filters/dragging.js
type: application/javascript
module-type: filteroperator

Filter operator returning "yes" if a drag is in progress, and "no" if not

The flag is set for the duration of the drag, and is cleared on dragend, which comes after
drop. A condition asking whether a drag is under way is therefore still true while the drop
is being handled, unlike one that watches the state tiddlers a drag keeps, since those are
usually deleted as part of handling the drop

\*/

"use strict";

exports.dragging = function(source,operator,options) {
	return [$tw.dragInProgress ? "yes" : "no"];
};
