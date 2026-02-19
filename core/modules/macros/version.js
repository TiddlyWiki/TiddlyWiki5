/*\
title: $:/core/modules/macros/version.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "version";

exports.params = [];

exports.run = function() {
	return $tw.version;
};
