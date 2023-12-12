/*\
title: $:/core/modules/utils/errors.js
type: application/javascript
module-type: utils

Custom errors for TiddlyWiki.

\*/
(function(){

function TranscludeRecursionError() {
	Error.apply(this,arguments);
	this.signatures = Object.create(null);
};

/* Maximum permitted depth of the widget tree for recursion detection */
TranscludeRecursionError.MAX_WIDGET_TREE_DEPTH = 1000;

TranscludeRecursionError.prototype = Object.create(Error);

exports.TranscludeRecursionError = TranscludeRecursionError;

})();
