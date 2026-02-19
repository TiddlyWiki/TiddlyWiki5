/*\
title: $:/core/modules/macros/changecount.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "changecount";

exports.params = [];

exports.run = function() {
	return this.wiki.getChangeCount(this.getVariable("currentTiddler")) + "";
};
