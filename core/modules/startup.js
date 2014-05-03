/*\
title: $:/core/modules/startup.js
type: application/javascript
module-type: startup

This is the main application logic for both the client and server

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Set to `true` to enable performance instrumentation
var PERFORMANCE_INSTRUMENTATION = false;

// Time (in ms) that we defer refreshing changes to draft tiddlers
var DRAFT_TIDDLER_TIMEOUT = 400;

// Default story and history lists
var DEFAULT_STORY_TITLE = "$:/StoryList";
var DEFAULT_HISTORY_TITLE = "$:/HistoryList";

// Default tiddlers
var DEFAULT_TIDDLERS_TITLE = "$:/DefaultTiddlers";
		
// Favicon tiddler
var FAVICON_TITLE = "$:/favicon.ico";

var widget = require("$:/core/modules/widgets/widget.js");

exports.startup = function() {
	var modules,n,m,f,commander;
	// Load modules
	$tw.modules.applyMethods("utils",$tw.utils);
	if($tw.node) {
		$tw.modules.applyMethods("utils-node",$tw.utils);
	}
	$tw.modules.applyMethods("global",$tw);
	$tw.modules.applyMethods("config",$tw.config);
	if($tw.browser) {
		$tw.utils.getBrowserInfo($tw.browser);
	}
	$tw.version = $tw.utils.extractVersionInfo();
	$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");
	$tw.modules.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.modules.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);
	$tw.macros = $tw.modules.getModulesByTypeAsHashmap("macro");
	// Set up the performance framework
	$tw.perf = new $tw.Performance(PERFORMANCE_INSTRUMENTATION);
	// Set up the parsers
	$tw.wiki.initParsers();
	// Set up the command modules
	$tw.Commander.initCommands();
	// Kick off the language manager and switcher
	$tw.language = new $tw.Language();
	$tw.languageSwitcher = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "language",
		controllerTitle: "$:/language",
		defaultPlugins: [
			"$:/languages/en-US"
		]
	});
	// Kick off the theme manager
	$tw.themeManager = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "theme",
		controllerTitle: "$:/theme",
		defaultPlugins: [
			"$:/themes/tiddlywiki/snowwhite",
			"$:/themes/tiddlywiki/vanilla"
		]
	});
	// Clear outstanding tiddler store change events to avoid an unnecessary refresh cycle at startup
	$tw.wiki.clearTiddlerEventQueue();
	// Open startup tiddlers
	openStartupTiddlers();
	// Set up the syncer object
	$tw.syncer = new $tw.Syncer({wiki: $tw.wiki});
	// Host-specific startup
	if($tw.browser) {
		// Set up our beforeunload handler
		window.addEventListener("beforeunload",function(event) {
			var confirmationMessage = undefined;
			if($tw.syncer.isDirty()) {
				confirmationMessage = "You have unsaved changes in TiddlyWiki";
				event.returnValue = confirmationMessage; // Gecko
			}
			return confirmationMessage;
		});
		// Install the popup manager
		$tw.popup = new $tw.utils.Popup({
			rootElement: document.body
		});
		// Install the animator
		$tw.anim = new $tw.utils.Animator();
		// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
		$tw.rootWidget = new widget.widget({
			type: "widget",
			children: []
		},{
			wiki: $tw.wiki,
			document: document
		});
		// Install the modal message mechanism
		$tw.modal = new $tw.utils.Modal($tw.wiki);
		$tw.rootWidget.addEventListener("tw-modal",function(event) {
			$tw.modal.display(event.param);
		});
		// Install the notification  mechanism
		$tw.notifier = new $tw.utils.Notifier($tw.wiki);
		$tw.rootWidget.addEventListener("tw-notify",function(event) {
			$tw.notifier.display(event.param);
		});
		// Install the scroller
		$tw.pageScroller = new $tw.utils.PageScroller();
		$tw.rootWidget.addEventListener("tw-scroll",function(event) {
			$tw.pageScroller.handleEvent(event);
		});
		// Listen for the tw-home message
		$tw.rootWidget.addEventListener("tw-home",function(event) {
			displayDefaultTiddlers();
		});
		// Install the save action handlers
		$tw.rootWidget.addEventListener("tw-save-wiki",function(event) {
			$tw.syncer.saveWiki({
				template: event.param,
				downloadType: "text/plain"
			});
		});
		$tw.rootWidget.addEventListener("tw-auto-save-wiki",function(event) {
			$tw.syncer.saveWiki({
				method: "autosave",
				template: event.param,
				downloadType: "text/plain"
			});
		});
		$tw.rootWidget.addEventListener("tw-download-file",function(event) {
			$tw.syncer.saveWiki({
				method: "download",
				template: event.param,
				downloadType: "text/plain"
			});
		});
		// Listen out for login/logout/refresh events in the browser
		$tw.rootWidget.addEventListener("tw-login",function() {
			$tw.syncer.handleLoginEvent();
		});
		$tw.rootWidget.addEventListener("tw-logout",function() {
			$tw.syncer.handleLogoutEvent();
		});
		$tw.rootWidget.addEventListener("tw-server-refresh",function() {
			$tw.syncer.handleRefreshEvent();
		});
		// Install the crypto event handlers
		$tw.rootWidget.addEventListener("tw-set-password",function(event) {
			$tw.passwordPrompt.createPrompt({
				serviceName: "Set a new password for this TiddlyWiki",
				noUserName: true,
				submitText: "Set password",
				canCancel: true,
				callback: function(data) {
					if(data) {
						$tw.crypto.setPassword(data.password);
					}
					return true; // Get rid of the password prompt
				}
			});
		});
		$tw.rootWidget.addEventListener("tw-clear-password",function(event) {
			$tw.crypto.setPassword(null);
		});
		// Ensure that $:/isEncrypted is maintained properly
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.utils.hop(changes,"$:/isEncrypted")) {
				$tw.crypto.updateCryptoStateTiddler();
			}
		});
		// Set up the favicon
		var faviconLink = document.getElementById("faviconLink"),
			setFavicon = function() {
				var tiddler = $tw.wiki.getTiddler(FAVICON_TITLE);
				if(tiddler) {
					faviconLink.setAttribute("href","data:" + tiddler.fields.type + ";base64," + tiddler.fields.text);
				}
			};
		setFavicon();
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.utils.hop(changes,FAVICON_TITLE)) {
				setFavicon();
			}
		});
		// Set up location hash update
		$tw.wiki.addEventListener("change",function(changes) {
			if($tw.utils.hop(changes,DEFAULT_STORY_TITLE) || $tw.utils.hop(changes,DEFAULT_HISTORY_TITLE)) {
				updateLocationHash();
			}
		});
		// Listen for changes to the browser location hash
		window.addEventListener("hashchange",function() {
			if(window.location.hash !== $tw.locationHash) {
				$tw.locationHash = window.location.hash;
				openStartupTiddlers({defaultToCurrentStory: true});
			}
		},false)
		// Set up the styles
		var styleTemplateTitle = "$:/core/ui/PageStylesheet",
			styleParser = $tw.wiki.parseTiddler(styleTemplateTitle);
		$tw.styleWidgetNode = $tw.wiki.makeWidget(styleParser,{document: $tw.fakeDocument});
		$tw.styleContainer = $tw.fakeDocument.createElement("style");
		$tw.styleWidgetNode.render($tw.styleContainer,null);
		$tw.styleElement = document.createElement("style");
		$tw.styleElement.innerHTML = $tw.styleContainer.textContent;
		document.head.insertBefore($tw.styleElement,document.head.firstChild);
		$tw.wiki.addEventListener("change",$tw.perf.report("styleRefresh",function(changes) {
			if($tw.styleWidgetNode.refresh(changes,$tw.styleContainer,null)) {
				$tw.styleElement.innerHTML = $tw.styleContainer.textContent;
			}
		}));
		// Display the $:/PageMacros tiddler to kick off the display
		renderPage();
		// Fix up the link between the root widget and the page container
		$tw.rootWidget.domNodes = [$tw.pageContainer];
		$tw.rootWidget.children = [$tw.pageWidgetNode];
		// If we're being viewed on a data: URI then give instructions for how to save
		if(document.location.protocol === "data:") {
			$tw.utils.dispatchCustomEvent(document,"tw-modal",{
				param: "$:/language/Modals/SaveInstructions"
			});
		}
		// Call browser startup modules
		$tw.modules.forEachModuleOfType("browser-startup",function(title,module) {
			if(module.startup) {
				module.startup();
			}
		});
	} else {
		// On the server, start a commander with the command line arguments
		commander = new $tw.Commander(
			$tw.boot.argv,
			function(err) {
				if(err) {
					console.log("Error: " + err);
				}
			},
			$tw.wiki,
			{output: process.stdout, error: process.stderr}
		);
		commander.execute();
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
		storyFilter;
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
	// If a target tiddler was specified add it to the history stack
	if(target && target !== "") {
		// The target tiddler doesn't need double square brackets, but we'll silently remove them if they're present
		if(target.indexOf("[[") === 0 && target.substr(-2) === "]]") {
			target = target.substr(2,target.length - 4);
		}
		$tw.wiki.addToHistory(target);
	}
	// Use the story filter specified in the hash, or the default tiddlers
	if(!storyFilter || storyFilter === "") {
		if(options.defaultToCurrentStory) {
			var currStoryList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE);
			storyFilter = $tw.utils.stringifyList(currStoryList);
		} else {
			storyFilter = $tw.wiki.getTiddlerText(DEFAULT_TIDDLERS_TITLE);			
		}
	}
	var storyList = $tw.wiki.filterTiddlers(storyFilter);
	// If the target tiddler isn't included then splice it in at the top
	if(target && storyList.indexOf(target) === -1) {
		storyList.unshift(target);
	}
	// Save the story list
	$tw.wiki.addTiddler({title: DEFAULT_STORY_TITLE, text: "", list: storyList},$tw.wiki.getModificationFields());
}

/*
Helper to display the default tiddlers
*/
function displayDefaultTiddlers() {
	$tw.wiki.addTiddler({title: DEFAULT_STORY_TITLE, text: "", list: getDefaultTiddlers()},$tw.wiki.getModificationFields());
}

function getDefaultTiddlers() {
	var defaultTiddlersTiddler = $tw.wiki.getTiddler(DEFAULT_TIDDLERS_TITLE),
		defaultTiddlers = [];
	if(defaultTiddlersTiddler) {
		defaultTiddlers = $tw.wiki.filterTiddlers(defaultTiddlersTiddler.fields.text);
	}
	return defaultTiddlers;
}

function updateLocationHash() {
	var storyList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE),
		historyList = $tw.wiki.getTiddlerData(DEFAULT_HISTORY_TITLE,[]);
		var targetTiddler = "";
	if(historyList.length > 0) {
		targetTiddler = historyList[historyList.length-1].title;
	}
	$tw.locationHash = "#" + encodeURIComponent(targetTiddler) + ":" + encodeURIComponent($tw.utils.stringifyList(storyList));
	if(window.location.hash !== $tw.locationHash) {
		window.location.hash = $tw.locationHash;
	}
}

/*
Main render function for PageMacros, which includes the PageTemplate
*/
function renderPage() {
	// Parse and render the template
	var templateTitle = "$:/core/ui/PageMacros",
		parser = $tw.wiki.parseTiddler(templateTitle);
	$tw.perf.report("mainRender",function() {
		$tw.pageWidgetNode = $tw.wiki.makeWidget(parser,{document: document, parentWidget: $tw.rootWidget});
		$tw.pageContainer = document.createElement("div");
		$tw.utils.addClass($tw.pageContainer,"tw-page-container-wrapper");
		document.body.insertBefore($tw.pageContainer,document.body.firstChild);
		$tw.pageWidgetNode.render($tw.pageContainer,null);
	})();
	// Prepare refresh mechanism
	var deferredChanges = Object.create(null),
		timerId;
	function refresh() {
		// Process the refresh
		$tw.pageWidgetNode.refresh(deferredChanges,$tw.pageContainer,null);
		deferredChanges = Object.create(null);
	}
	// Add the change event handler
	$tw.wiki.addEventListener("change",$tw.perf.report("mainRefresh",function(changes) {
		// Check if only drafts have changed
		var onlyDraftsHaveChanged = true;
		for(var title in changes) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(!tiddler || !tiddler.hasField("draft.of")) {
				onlyDraftsHaveChanged = false;
			}
		}
		// Defer the change if only drafts have changed
		if(timerId) {
			clearTimeout(timerId);
		}
		timerId = null;
		if(onlyDraftsHaveChanged) {
			timerId = setTimeout(refresh,DRAFT_TIDDLER_TIMEOUT);
			$tw.utils.extend(deferredChanges,changes);
		} else {
			$tw.utils.extend(deferredChanges,changes);
			refresh();
		}
	}));
}

})();
