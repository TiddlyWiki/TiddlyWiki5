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

exports.startup = function(loggedIn) {
	if(loggedIn) {
		$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleLoadedWikis, text: "no"},true);
		// Load tiddlers
		$tw.plugins.dropbox.loadWikiFiles("/",function() {
			$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleLoadedWikis, text: "yes"},true);
			console.log("Loaded all wikis",$tw.wiki.tiddlers);
		});
	}
};

})();
