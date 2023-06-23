/*\
title: $:/plugins/tiddlywiki/sqlite3store/suppress-boot.js
type: application/javascript

Suppress the usual synchronous startup process so that it can instead be done within the callback from sqlite3 initialisation.

This file is spliced into the HTML file to be executed before the boot kernel has been loaded.

\*/

(function() {

// Initialse skeleton TiddlyWiki global because we run before bootprefix.js and boot.js
window.$tw = window.$tw || Object.create(null);
$tw.hooks = $tw.hooks || { names: {}};
$tw.boot = $tw.boot || {};
$tw.boot.preloadDirty = $tw.boot.preloadDirty || [];

// Tell TiddlyWiki not to boot itself
$tw.boot.suppressBoot = true;

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/suppress-boot.js