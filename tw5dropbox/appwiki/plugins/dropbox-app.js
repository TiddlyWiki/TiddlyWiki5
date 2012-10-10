/*\
title: $:/plugins/dropbox/dropbox-app.js
type: application/javascript
module-type: dropbox-startup

Startup the Dropbox wiki app

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.startup = function() {
	// Load tiddlers
	$tw.plugins.dropbox.loadTiddlerFiles("/My TiddlyWiki/tiddlers",function() {
		console.log("Loaded all tiddlers",$tw.wiki.tiddlers);
	});
};

})();
