/*\
title: $:/core/modules/startup/focused-tiddler.js
type: application/javascript
module-type: startup

Track the currently focused (most prominently visible) tiddler in the story river
and write its title to $:/temp/focussedTiddler.

A tiddler is considered "focused" when:
- It is clicked inside the story river, OR
- It is the topmost tiddler whose top edge is within `topOffset` pixels of the
  viewport top after a scroll, OR
- The story list changes (e.g. navigation), after the animation completes.

\*/
"use strict";

// Export name and synchronous status
exports.name = "focused-tiddler";
exports.platforms = ["browser"];
exports.after = ["render","story"];
exports.synchronous = true;

var FOCUSED_TIDDLER_TITLE = "$:/temp/focussedTiddler";
var TOP_OFFSET_CONFIG = "$:/config/FocussedTiddler/TopOffset";
var DEFAULT_TOP_OFFSET = 100;

exports.startup = function() {
	var topOffset = DEFAULT_TOP_OFFSET;

	function updateTopOffset() {
		var val = parseInt($tw.wiki.getTiddlerText(TOP_OFFSET_CONFIG,String(DEFAULT_TOP_OFFSET)),10);
		topOffset = isNaN(val) ? DEFAULT_TOP_OFFSET : val;
	}

	var previousDom = null;

	function update(dom) {
		if(dom === previousDom) {
			return;
		}
		var title;
		if(dom) {
			title = dom.getAttribute("data-tiddler-title");
			if(!title) {
				var titleEl = dom.querySelector(".tc-tiddler-title .tc-titlebar .tc-title");
				title = titleEl ? titleEl.textContent : "";
			}
		}
		$tw.wiki.addTiddler({
			title: FOCUSED_TIDDLER_TITLE,
			text: title || ""
		});
		if(previousDom) {
			$tw.utils.removeClass(previousDom,"tc-focused-tiddler");
		}
		if(dom) {
			$tw.utils.addClass(dom,"tc-focused-tiddler");
		}
		previousDom = dom;
	}

	function check() {
		var tiddlers = document.querySelectorAll(".tc-story-river .tc-tiddler-frame");
		if(tiddlers.length === 0) {
			update(null);
			return;
		}
		// Walk from last to first: find the last tiddler whose top is at or above topOffset
		for(var i = tiddlers.length - 1; i >= 0; i--) {
			var rect = tiddlers[i].getBoundingClientRect();
			if(rect.top > topOffset) {
				continue;
			}
			update(tiddlers[i]);
			return;
		}
		// All tiddlers are below topOffset — focus the first one
		update(tiddlers[0]);
	}

	updateTopOffset();
	// initialize focused tiddler after the initial render completes
	setTimeout(function() {
		check();
	},0);

	// Debounced scroll handler (captures scroll on any scrolling element)
	var scrollTimer;
	window.addEventListener("scroll",function() {
		if(scrollTimer !== undefined) {
			return;
		}
		scrollTimer = setTimeout(function() {
			scrollTimer = undefined;
			check();
		},250);
	},true);

	// Click handler — immediately focus the clicked tiddler
	window.addEventListener("click",function(event) {
		var storyRiver = document.querySelector(".tc-story-river");
		if(!storyRiver || !storyRiver.contains(event.target)) {
			return;
		}
		var tiddlers = document.querySelectorAll(".tc-story-river .tc-tiddler-frame");
		for(var i = tiddlers.length - 1; i >= 0; i--) {
			if(tiddlers[i].contains(event.target)) {
				update(tiddlers[i]);
				return;
			}
		}
	});

	// Wiki change handler — re-check after navigation/story changes
	$tw.wiki.addEventListener("change",function(changes) {
		if(changes[TOP_OFFSET_CONFIG]) {
			updateTopOffset();
			check();
		}
		if(changes["$:/HistoryList"] || changes["$:/StoryList"]) {
			setTimeout(function() {
				check();
			},$tw.utils.getAnimationDuration() + 100);
		}
	});
};
