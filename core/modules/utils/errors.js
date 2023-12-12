/*\
title: $:/core/modules/utils/errors.js
type: application/javascript
module-type: utils

Custom errors for TiddlyWiki.

\*/
(function(){

function TranscludeRecursionError(depth) {
	this.depth = depth;
	this.signatures = Object.create(null);
};

exports.TranscludeRecursionError = TranscludeRecursionError;

})();
