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
	// Check that we've been loaded from the dropbox
	var url = (window.location.protocol + "//" + window.location.host + window.location.pathname),
		wikiName;
	if(url.indexOf($tw.plugins.dropbox.userInfo.publicAppUrl) === 0) {
		var p = url.indexOf("/",$tw.plugins.dropbox.userInfo.publicAppUrl.length + 1);
		if(p !== -1 && url.substr(p) === "/index.html") {
			wikiName = decodeURIComponent(url.substring($tw.plugins.dropbox.userInfo.publicAppUrl.length + 1,p));
		}
	}
	if(wikiName) {
		// Save the wiki name for later
		$tw.plugins.dropbox.wikiName = wikiName;
		$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleWikiName, text: $tw.plugins.dropbox.wikiName},true);
		// Load any tiddlers embedded in the index file
		var index = $tw.wiki.getTiddlerData($tw.plugins.dropbox.titleTiddlerIndex);
		if(index) {
			$tw.wiki.addTiddlers(index.tiddlers);
			$tw.wiki.addTiddlers(index.shadows,true);
		}
		// Check for later versions of files on Dropbox
		$tw.plugins.dropbox.loadTiddlerFiles("/" + $tw.plugins.dropbox.wikiName + "/tiddlers",function(fileRevisions) {
			// Save the tiddler index
			$tw.plugins.dropbox.saveTiddlerIndex("/" + $tw.plugins.dropbox.wikiName + "/index.html",fileRevisions,function(error) {
				console.log("Saved tiddler index");
			});
		});	
	} else {
		alert("This TiddlyWiki file must be in Dropbox");
	}
};

})();
