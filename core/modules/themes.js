/*\
title: $:/core/modules/themes.js
type: application/javascript
module-type: global

Manages themes and styling.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function ThemeManager(wiki) {
	this.wiki = wiki;
	// Unpack the current theme tiddlers
	$tw.wiki.unpackPluginTiddlers("theme");
}

exports.ThemeManager = ThemeManager;

})();
