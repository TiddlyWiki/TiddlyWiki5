/*\
title: $:/plugins/dropbox/dropbox-main.js
type: application/javascript
module-type: dropbox-startup

Startup the Dropbox main app

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.startup = function() {
	// Load tiddlers
	$tw.plugins.dropbox.loadWikiFiles("/",function() {
		console.log("Loaded all wikis",$tw.wiki.tiddlers);
	});
};

})();
