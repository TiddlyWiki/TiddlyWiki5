/*\
title: $:/plugins/tiddlywiki/demo-alternate-store/rawmarkup.js
type: application/javascript
module-type: library

Startup code injected as raw markup

\*/

(function() {

// Need to initialise these because we run before bootprefix.js and boot.js
$tw = window.$tw || Object.create(null);
$tw.hooks = $tw.hooks || { names: {}};
$tw.boot = $tw.boot || {};
$tw.boot.preloadDirty = $tw.boot.preloadDirty || [];

$tw.Wiki = function() {
	
};

})();
