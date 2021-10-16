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
var CONFIG_PERMALINKVIEW_COPY_TO_CLIPBOARD = "$:/config/Navigation/Permalinkview/CopyToClipboard"; // Can be "yes" (default) or "no"
var CONFIG_PERMALINKVIEW_UPDATE_ADDRESS_BAR = "$:/config/Navigation/Permalinkview/UpdateAddressBar"; // Can be "yes" (default) or "no"


// Links to help, if there is no param
var HELP_OPEN_EXTERNAL_WINDOW = "http://tiddlywiki.com/#WidgetMessage%3A%20tm-open-external-window";

exports.startup = function() {
	// Open startup tiddlers
	openStartupTiddlers({
		disableHistory: $tw.boot.disableStartupNavigation
	});
	if($tw.browser) {
		// Set up location hash update
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.utils.hop(changes,DEFAULT_STORY_TITLE) || $tw.utils.hop(changes,DEFAULT_HISTORY_TITLE)) {
				updateLocationHash({
					updateAddressBar: $tw.wiki.getTiddlerText(CONFIG_UPDATE_ADDRESS_BAR,"permaview").trim(),
					updateHistory: $tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY,"no").trim()
				});
			}
		});
		// Listen for changes to the browser location hash
		window.addEventListener("hashchange",function() {
			var hash = $tw.utils.getLocationHash();
			if(hash !== $tw.locationHash) {
				$tw.locationHash = hash;
				openStartupTiddlers({defaultToCurrentStory: true});
			}
		},false);
		// Listen for the tm-browser-refresh message
		$tw.rootWidget.addEventListener("tm-browser-refresh",function(event) {
			window.location.reload(true);
		});
		// Listen for tm-open-external-window message
		$tw.rootWidget.addEventListener("tm-open-external-window",function(event) {
			var paramObject = event.paramObject || {},
				strUrl = event.param || HELP_OPEN_EXTERNAL_WINDOW,
				strWindowName = paramObject.windowName,
				strWindowFeatures = paramObject.windowFeatures;
			window.open(strUrl, strWindowName, strWindowFeatures);
		});
		// Listen for the tm-print message
		$tw.rootWidget.addEventListener("tm-print",function(event) {
			(event.event.view || window).print();
		});
		// Listen for the tm-home message
		$tw.rootWidget.addEventListener("tm-home",function(event) {
			window.location.hash = "";
			var storyFilter = $tw.wiki.getTiddlerText(DEFAULT_TIDDLERS_TITLE),
				storyList = $tw.wiki.filterTiddlers(storyFilter);
			//invoke any hooks that might change the default story list
			storyList = $tw.hooks.invokeHook("th-opening-default-tiddlers-list",storyList);
			$tw.wiki.addTiddler({title: DEFAULT_STORY_TITLE, text: "", list: storyList},$tw.wiki.getModificationFields());
			if(storyList[0]) {
				$tw.wiki.addToHistory(storyList[0]);
			}
		});
		// Listen for the tm-permalink message
		$tw.rootWidget.addEventListener("tm-permalink",function(event) {
			updateLocationHash({
				updateAddressBar: $tw.wiki.getTiddlerText(CONFIG_PERMALINKVIEW_UPDATE_ADDRESS_BAR,"yes").trim() === "yes" ? "permalink" : "none",
				updateHistory: $tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY,"no").trim(),
				targetTiddler: event.param || event.tiddlerTitle,
				copyToClipboard: $tw.wiki.getTiddlerText(CONFIG_PERMALINKVIEW_COPY_TO_CLIPBOARD,"yes").trim() === "yes" ? "permalink" : "none"
			});
		});
		// Listen for the tm-permaview message
		$tw.rootWidget.addEventListener("tm-permaview",function(event) {
			updateLocationHash({
				updateAddressBar: $tw.wiki.getTiddlerText(CONFIG_PERMALINKVIEW_UPDATE_ADDRESS_BAR,"yes").trim() === "yes" ? "permaview" : "none",
				updateHistory: $tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY,"no").trim(),
				targetTiddler: event.param || event.tiddlerTitle,
				copyToClipboard: $tw.wiki.getTiddlerText(CONFIG_PERMALINKVIEW_COPY_TO_CLIPBOARD,"yes").trim() === "yes" ? "permaview" : "none"
			});
		});
	}
};

/*
Process the location hash to open the specified tiddlers. Options:
disableHistory: if true $:/History is NOT updated
defaultToCurrentStory: If true, the current story is retained as the default, instead of opening the default tiddlers
*/
function openStartupTiddlers(options) {
	options = options || {};
	// Work out the target tiddler and the story filter. "null" means "unspecified"
	var target = null,
		storyFilter = null;
	if($tw.locationHash.length > 1) {
		var hash = $tw.locationHash.substr(1),
			split = hash.indexOf(":");
		if(split === -1) {
			target = $tw.utils.decodeURIComponentSafe(hash.trim());
		} else {
			target = $tw.utils.decodeURIComponentSafe(hash.substr(0,split).trim());
			storyFilter = $tw.utils.decodeURIComponentSafe(hash.substr(split + 1).trim());
		}
	}
	// If the story wasn't specified use the current tiddlers or a blank story
	if(storyFilter === null) {
		if(options.defaultToCurrentStory) {
			var currStoryList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE);
			storyFilter = $tw.utils.stringifyList(currStoryList);
		} else {
			if(target && target !== "") {
				storyFilter = "";
			} else {
				storyFilter = $tw.wiki.getTiddlerText(DEFAULT_TIDDLERS_TITLE);
			}
		}
	}
	// Process the story filter to get the story list
	var storyList = $tw.wiki.filterTiddlers(storyFilter);
	// Invoke any hooks that want to change the default story list
	storyList = $tw.hooks.invokeHook("th-opening-default-tiddlers-list",storyList);
	// If the target tiddler isn't included then splice it in at the top
	if(target && storyList.indexOf(target) === -1) {
		storyList.unshift(target);
	}
	// Save the story list
	$tw.wiki.addTiddler({title: DEFAULT_STORY_TITLE, text: "", list: storyList},$tw.wiki.getModificationFields());
	// Update history
	var story = new $tw.Story({
		wiki: $tw.wiki,
		storyTitle: DEFAULT_STORY_TITLE,
		historyTitle: DEFAULT_HISTORY_TITLE
	});
	if(!options.disableHistory) {
		// If a target tiddler was specified add it to the history stack
		if(target && target !== "") {
			// The target tiddler doesn't need double square brackets, but we'll silently remove them if they're present
			if(target.indexOf("[[") === 0 && target.substr(-2) === "]]") {
				target = target.substr(2,target.length - 4);
			}
			story.addToHistory(target);
		} else if(storyList.length > 0) {
			story.addToHistory(storyList[0]);
		}
	}
}

/*
options: See below
options.updateAddressBar: "permalink", "permaview" or "no" (defaults to "permaview")
options.updateHistory: "yes" or "no" (defaults to "no")
options.copyToClipboard: "permalink", "permaview" or "no" (defaults to "no")
options.targetTiddler: optional title of target tiddler for permalink
*/
function updateLocationHash(options) {
	// Get the story and the history stack
	var storyList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE),
		historyList = $tw.wiki.getTiddlerData(DEFAULT_HISTORY_TITLE,[]),
		targetTiddler = "";
	if(options.targetTiddler) {
		targetTiddler = options.targetTiddler;
	} else {
		// The target tiddler is the one at the top of the stack
		if(historyList.length > 0) {
			targetTiddler = historyList[historyList.length-1].title;
		}
		// Blank the target tiddler if it isn't present in the story
		if(storyList.indexOf(targetTiddler) === -1) {
			targetTiddler = "";
		}
	}
	// Assemble the location hash
	switch(options.updateAddressBar) {
		case "permalink":
			$tw.locationHash = "#" + encodeURIComponent(targetTiddler);
			break;
		case "permaview":
			$tw.locationHash = "#" + encodeURIComponent(targetTiddler) + ":" + encodeURIComponent($tw.utils.stringifyList(storyList));
			break;
	}
	// Copy URL to the clipboard
	switch(options.copyToClipboard) {
		case "permalink":
			$tw.utils.copyToClipboard($tw.utils.getLocationPath() + "#" + encodeURIComponent(targetTiddler));
			break;
		case "permaview":
			$tw.utils.copyToClipboard($tw.utils.getLocationPath() + "#" + encodeURIComponent(targetTiddler) + ":" + encodeURIComponent($tw.utils.stringifyList(storyList)));
			break;
	}
	// Only change the location hash if we must, thus avoiding unnecessary onhashchange events
	if($tw.utils.getLocationHash() !== $tw.locationHash) {
		if(options.updateHistory === "yes") {
			// Assign the location hash so that history is updated
			window.location.hash = $tw.locationHash;
		} else {
			// We use replace so that browser history isn't affected
			window.location.replace(window.location.toString().split("#")[0] + $tw.locationHash);
		}
	}
}

})();
