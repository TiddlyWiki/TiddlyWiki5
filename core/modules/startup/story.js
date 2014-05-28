/*\
title: $:/core/modules/startup/story.js
type: application/javascript
module-type: startup

Load core modules

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "story";
exports.after = ["startup"];
exports.synchronous = true;

// Default story and history lists
var DEFAULT_STORY_TITLE = "$:/StoryList";
var DEFAULT_HISTORY_TITLE = "$:/HistoryList";

// Default tiddlers
var DEFAULT_TIDDLERS_TITLE = "$:/DefaultTiddlers";

// Config
var CONFIG_UPDATE_ADDRESS_BAR = "$:/config/Navigation/UpdateAddressBar"; // Can be "no", "permalink", "permaview"
var CONFIG_UPDATE_HISTORY = "$:/config/Navigation/UpdateHistory"; // Can be "yes" or "no"

exports.startup = function() {
	// Open startup tiddlers
	openStartupTiddlers();
	if($tw.browser) {
		// Set up location hash update
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.utils.hop(changes,DEFAULT_STORY_TITLE) || $tw.utils.hop(changes,DEFAULT_HISTORY_TITLE)) {
				updateLocationHash();
			}
		});
		// Listen for changes to the browser location hash
		window.addEventListener("hashchange",function() {
			var hash = $tw.utils.getLocationHash();
			if(hash !== $tw.locationHash) {
				$tw.locationHash = hash;
				openStartupTiddlers({defaultToCurrentStory: true});
			}
		},false)
		// Listen for the tw-home message
		$tw.rootWidget.addEventListener("tw-home",function(event) {
			var storyFilter = $tw.wiki.getTiddlerText(DEFAULT_TIDDLERS_TITLE),
				storyList = $tw.wiki.filterTiddlers(storyFilter);
			$tw.wiki.addTiddler({title: DEFAULT_STORY_TITLE, text: "", list: storyList},$tw.wiki.getModificationFields());
		});
	}
};

/*
Process the location hash to open the specified tiddlers. Options:
defaultToCurrentStory: If true, the current story is retained as the default, instead of opening the default tiddlers
*/
function openStartupTiddlers(options) {
	options = options || {};
	// Decode the hash portion of our URL
	var target,
		storyFilter = null;
	if($tw.locationHash.length > 1) {
		var hash = $tw.locationHash.substr(1),
			split = hash.indexOf(":");
		if(split === -1) {
			target = decodeURIComponent(hash.trim());
		} else {
			target = decodeURIComponent(hash.substr(0,split).trim());
			storyFilter = decodeURIComponent(hash.substr(split + 1).trim());
		}
	}
	// If the story wasn't specified use the current tiddlers or a blank story
	if(storyFilter === null) {
		if(options.defaultToCurrentStory) {
			var currStoryList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE);
			storyFilter = $tw.utils.stringifyList(currStoryList);
		} else {
			storyFilter = "";
		}
	}
	var storyList = $tw.wiki.filterTiddlers(storyFilter);
	// If the target tiddler isn't included then splice it in at the top
	if(target && storyList.indexOf(target) === -1) {
		storyList.unshift(target);
	}
	// Save the story list
	$tw.wiki.addTiddler({title: DEFAULT_STORY_TITLE, text: "", list: storyList},$tw.wiki.getModificationFields());
	// If a target tiddler was specified add it to the history stack
	if(target && target !== "") {
		// The target tiddler doesn't need double square brackets, but we'll silently remove them if they're present
		if(target.indexOf("[[") === 0 && target.substr(-2) === "]]") {
			target = target.substr(2,target.length - 4);
		}
		$tw.wiki.addToHistory(target);
	} else if(storyList.length > 0) {
		$tw.wiki.addToHistory(storyList[0]);
	}
}

function updateLocationHash() {
	var updateAddressBar = $tw.wiki.getTiddlerText(CONFIG_UPDATE_ADDRESS_BAR,"permaview").trim();
	if(updateAddressBar !== "no") {
		// Get the story and the history stack
		var storyList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE),
			historyList = $tw.wiki.getTiddlerData(DEFAULT_HISTORY_TITLE,[]);
			var targetTiddler = "";
		// The target tiddler is the one at the top of the stack
		if(historyList.length > 0) {
			targetTiddler = historyList[historyList.length-1].title;
		}
		// Blank the target tiddler if it isn't present in the story
		if(storyList.indexOf(targetTiddler) === -1) {
			targetTiddler = "";
		}
		// Assemble the location hash
		if(updateAddressBar === "permalink") {
			$tw.locationHash = "#" + encodeURIComponent(targetTiddler)
		} else {
			$tw.locationHash = "#" + encodeURIComponent(targetTiddler) + ":" + encodeURIComponent($tw.utils.stringifyList(storyList));
		}
		// Only change the location hash if we must, thus avoiding unnecessary onhashchange events
		if($tw.utils.getLocationHash() !== $tw.locationHash) {
			if($tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY,"no").trim() === "yes") {
				// Assign the location hash so that history is updated
				window.location.hash = $tw.locationHash;
			} else {
				// We use replace so that browser history isn't affected
				window.location.replace(window.location.toString().split("#")[0] + $tw.locationHash);
			}
		}
	}
}

})();
