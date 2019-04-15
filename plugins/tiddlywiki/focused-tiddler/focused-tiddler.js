/*\
title: $:/plugins/tiddlywiki/focused-tiddler/focused-tiddler.js
type: application/javascript
module-type: startup

Update $:/HistorList with focused-tiddler field, which allows us to active TOC-events.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HISTORY_TIDDLER = "$:/HistoryList";

// Export name and synchronous status
exports.name = "focused-tiddler";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

exports.startup = function() {
	window.addEventListener("load",onLoad,false);
	window.addEventListener("scroll",debounce(worker,100),false);

	// TW listeners
 	$tw.wiki.addEventListener("change", handleChangeEvent);
};

// TODO There are several story lists possible!
// Needed if a tiddler is removed from story.
function handleChangeEvent(changedTiddlers) {
	if(changedTiddlers["$:/StoryList"]) {
		setTimeout(worker,$tw.utils.getAnimationDuration() + 10);
	}
}

function onLoad(event) {
	worker();
}

function worker() {
	setFocusedTiddler();
}

function setFocusedTiddler(forceTitle) {
	var historyTiddler = $tw.wiki.getTiddler(HISTORY_TIDDLER);
	var old = (historyTiddler.fields && historyTiddler.fields["focused-tiddler"]) ? historyTiddler.fields["focused-tiddler"] : "";

	if (forceTitle !== undefined) {
		$tw.wiki.addTiddler(new $tw.Tiddler(
			historyTiddler,
			{"focused-tiddler": forceTitle},
			$tw.wiki.getModificationFields()
		));
	return;
	}

	if (old === "") {
		newTitle = historyTiddler.fields["current-tiddler"];
	} else {
		var newTitle = getTopMost();
	} // else

	if (newTitle !== old) {
		$tw.wiki.addTiddler(new $tw.Tiddler(
			historyTiddler,
			{"focused-tiddler": newTitle},
			$tw.wiki.getModificationFields()
		));
	}; // if newTitle
};

function getTopMost() {
	var elements = document.querySelectorAll(".tc-tiddler-frame[data-tiddler-title]"),
		topmostElement = null,
//		topmostElementTop = 1 * 1000 * 1000,
		title = "";

	var viewportWidth = window.innerWidth || document.documentElement.clientWidth,
		viewportHeight = window.innerHeight || document.documentElement.clientHeight;

	var treshold = viewportHeight / 4;
	var found = false;

	$tw.utils.each(elements,function(element) {
		// Check if the element is visible
		var elementRect = element.getBoundingClientRect();

		if (found) {/*do nothing*/
		} else if ((elementRect.top > 0) && (elementRect.top < treshold) && (elementRect.bottom <= treshold)) {
			// detect short tiddler
			topmostElement = element;
			found = true;
		} else if(elementRect.top < treshold ) {
			topmostElement = element;
		}
	});

	if(topmostElement) {
		title = topmostElement.getAttribute("data-tiddler-title");
	}
	return title;
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

})();
