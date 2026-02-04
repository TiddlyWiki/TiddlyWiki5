/*\
title: $:/core/modules/info/mediaquerytracker.js
type: application/javascript
module-type: info

Initialise $:/info/ tiddlers derived from media queries via 

\*/

"use strict";

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	if($tw.browser) {
		// Functions to start and stop tracking a particular media query tracker tiddler
		function track(title) {
			var result = {},
				tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var mediaQuery = tiddler.fields["media-query"],
					infoTiddler = tiddler.fields["info-tiddler"],
					infoTiddlerAlt = tiddler.fields["info-tiddler-alt"];
				if(mediaQuery && infoTiddler) {
					// Evaluate and track the media query
					result.mqList = window.matchMedia(mediaQuery);
					function getResultTiddlers() {
						var value = result.mqList.matches ? "yes" : "no",
							tiddlers = [];
						tiddlers.push({title: infoTiddler, text: value});
						if(infoTiddlerAlt) {
							tiddlers.push({title: infoTiddlerAlt, text: value});
						}
						return tiddlers;
					};
					updateInfoTiddlersCallback(getResultTiddlers());
					result.handler = function(event) {
						updateInfoTiddlersCallback(getResultTiddlers());
					};
					result.mqList.addEventListener("change",result.handler);
				}
			}
			return result;
		}
		function untrack(enterValue) {
			if(enterValue.mqList && enterValue.handler) {
				enterValue.mqList.removeEventListener("change",enterValue.handler);
			}
		}
		// Track media query tracker tiddlers
		function fnEnter(title) {
			return track(title);
		}
		function fnLeave(title,enterValue) {
			untrack(enterValue);
		}
		function fnChange(title,enterValue) {
			untrack(enterValue);
			return track(title);
		}
		$tw.filterTracker.track({
			filterString: "[all[tiddlers+shadows]tag[$:/tags/MediaQueryTracker]!is[draft]]",
			fnEnter: fnEnter,
			fnLeave: fnLeave,
			fnChange: fnChange
		});
	}
	return [];
};
