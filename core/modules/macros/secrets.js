/*\
title: $:/core/modules/macros/secrets.js
type: application/javascript
module-type: macro

Macro to get secrets store state

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "secrets-state";

exports.params = [];

exports.run = function() {
	return $tw.utils.getSecretsStoreState();
};
