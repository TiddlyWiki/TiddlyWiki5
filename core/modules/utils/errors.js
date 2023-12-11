/*\
title: $:/core/modules/utils/errors.js
type: application/javascript
module-type: utils

Custom errors for TiddlyWiki.

\*/
(function(){

function TranscludeRecursionError(transcludeMarker) {
	this.marker = transcludeMarker;
};

exports.TranscludeRecursionError = TranscludeRecursionError;

})();
