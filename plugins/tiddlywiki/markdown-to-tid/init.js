/**\
title: $:/plugins/tiddlywiki/markdown-to-tid/init.js
type: application/javascript
module-type: startup

Initialization for markdown-to-tid plugin

**/

(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	// Export parsetree functions to $tw.utils
	var parsetreeModule = require("$:/plugins/tiddlywiki/markdown-to-tid/utils/parsetree.js");
	$tw.utils.serializeWikitextParseTree = parsetreeModule.serializeWikitextParseTree;
	$tw.utils.serializeAttribute = parsetreeModule.serializeAttribute;

})();