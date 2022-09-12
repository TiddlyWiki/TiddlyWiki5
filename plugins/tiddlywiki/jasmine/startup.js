/*\
title: $:/plugins/tiddlywiki/jasmine/startup.js
type: application/javascript
module-type: startup

The main module of the Jasmine test plugin for TiddlyWiki5

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: true */
"use strict";

// Jasmine is called explicitly on Node.js, so there is no reason to have a
// startup task.
if($tw.browser) {
	var jasmine = require("./jasmine-plugin.js");

	exports.name = "jasmine";

	exports.startup = jasmine.runTests;
}

})();
