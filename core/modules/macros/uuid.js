/*\
title: $:/core/modules/macros/uuid.js
type: application/javascript
module-type: macro

Returns a generated uuid
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "uuid";
exports.params = [];
exports.run = function() {
	var id = $tw.utils.uuid();
	return id;
};

})();