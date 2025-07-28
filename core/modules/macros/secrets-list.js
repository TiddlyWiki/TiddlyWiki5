/*\
title: $:/core/modules/macros/secrets-list.js
type: application/javascript
module-type: macro

Macro to list secret names

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "secrets-list";

exports.params = [];

exports.run = function() {
	var secrets = $tw.utils.listSecrets();
	return secrets.join(" ");
};

})();
