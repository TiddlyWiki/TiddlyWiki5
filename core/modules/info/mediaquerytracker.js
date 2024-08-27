/*\
title: $:/core/modules/info/mediaquerytracker.js
type: application/javascript
module-type: info

Initialise $:/info/ tiddlers derived from media queries via 

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	var infoTiddlerFields = [];
	if($tw.browser) {
		// Get the media query tracker tiddlers
		var trackers = $tw.wiki.getTiddlersWithTag("$:/tags/MediaQueryTracker");
		$tw.utils.each(trackers,function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var mediaQuery = tiddler.fields["media-query"],
					infoTiddler = tiddler.fields["info-tiddler"],
					infoTiddlerAlt = tiddler.fields["info-tiddler-alt"];
				if(mediaQuery && infoTiddler) {
					// Evaluate and track the media query
					var mqList = window.matchMedia(mediaQuery);
					function getResultTiddlers() {
						var value = mqList.matches ? "yes" : "no",
							tiddlers = [{title: infoTiddler, text: value}];
						if(infoTiddlerAlt) {
							tiddlers.push({title: infoTiddlerAlt, text: value})
						}
						return tiddlers;
					};
					infoTiddlerFields.push.apply(infoTiddlerFields,getResultTiddlers());
					mqList.addEventListener("change",function(event) {
						updateInfoTiddlersCallback(getResultTiddlers());
					});
				}
			}
		});
	}
	return infoTiddlerFields;
};

})();
