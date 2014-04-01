/*\
title: $:/core/modules/filters/basename.js
type: application/javascript
module-type: filteroperator

Filter operator for basenaming each current list element.
For instance, $:/core/modules/filters/basename.js will become basename.js

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.basename = function(source, operator, options) {
	var results = [];

	function basename(title) {
		var slash = title.lastIndexOf("/");
		if((slash >= 0) && (slash<title.length-1)) {
			results.push(title.substr(slash + 1));
		} else {
			results.push(title);
		}
	}

	if($tw.utils.isArray(source)) {
		$tw.utils.each(source, function(title) {
			basename(title);
		});
	} else {
		$tw.utils.each(source, function(element,title) {
			basename(title);
		});
	}
	return results;
};

})();
