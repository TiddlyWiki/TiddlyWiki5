/*\
title: js/App.js

This is the main() function in the browser

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var WikiStore = require("./WikiStore.js").WikiStore,
	Tiddler = require("./Tiddler.js").Tiddler,
	tiddlerInput = require("./TiddlerInput.js"),
	tiddlerOutput = require("./TiddlerOutput.js"),
	WikiTextParser = require("./WikiTextParser.js").WikiTextParser,
	JSONParser = require("./JSONParser.js").JSONParser,
	JavaScriptParser = require("./JavaScriptParser.js").JavaScriptParser,
	ImageParser = require("./ImageParser.js").ImageParser,
	Navigators = require("./Navigators.js").Navigators,
	StoryNavigator = require("./StoryNavigator.js").StoryNavigator;

var App = function() {
	var t;
	// Check if we're running on the server or the client
	this.isBrowser = typeof window !== "undefined";
	// Create the main store
	this.store = new WikiStore();	
	// Register the parsers
	this.store.registerParser("text/x-tiddlywiki",new WikiTextParser({store: this.store}));
	this.store.registerParser("application/json",new JSONParser());
	var imageParser = new ImageParser();
	this.store.registerParser("image/svg+xml",imageParser);
	this.store.registerParser("image/jpg",imageParser);
	this.store.registerParser("image/jpeg",imageParser);
	this.store.registerParser("image/png",imageParser);
	this.store.registerParser("image/gif",imageParser);
	// Register the standard tiddler serializers and deserializers
	tiddlerInput.register(this.store);
	tiddlerOutput.register(this.store);
	// Add the shadow tiddlers that are built into TiddlyWiki
	var shadowShadowStore = new WikiStore({
			shadowStore: null
		}),
		shadowShadows = [
			{title: "StyleSheet", text: ""},
			{title: "MarkupPreHead", text: ""},
			{title: "MarkupPostHead", text: ""},
			{title: "MarkupPreBody", text: ""},
			{title: "MarkupPostBody", text: ""},
			{title: "TabTimeline", text: "<<timeline>>"},
			{title: "TabAll", text: "<<list all>>"},
			{title: "TabTags", text: "<<allTags excludeLists>>"},
			{title: "TabMoreMissing", text: "<<list missing>>"},
			{title: "TabMoreOrphans", text: "<<list orphans>>"},
			{title: "TabMoreShadowed", text: "<<list shadowed>>"},
			{title: "AdvancedOptions", text: "<<options>>"},
			{title: "PluginManager", text: "<<plugins>>"},
			{title: "SystemSettings", text: ""},
			{title: "ToolbarCommands", text: "|~ViewToolbar|closeTiddler closeOthers +editTiddler > fields syncing permalink references jump|\n|~EditToolbar|+saveTiddler -cancelTiddler deleteTiddler|"},
			{title: "WindowTitle", text: "<<tiddler SiteTitle>> - <<tiddler SiteSubtitle>>"},
			{title: "DefaultTiddlers", text: "[[GettingStarted]]"},
			{title: "MainMenu", text: "[[GettingStarted]]"},
			{title: "SiteTitle", text: "My TiddlyWiki"},
			{title: "SiteSubtitle", text: "a reusable non-linear personal web notebook"},
			{title: "SiteUrl", text: ""},
			{title: "SideBarOptions", text: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY" "journal">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "options \u00bb" "Change TiddlyWiki advanced options">>'},
			{title: "SideBarTabs", text: '<<tabs txtMainTab "Timeline" "Timeline" TabTimeline "All" "All tiddlers" TabAll "Tags" "All tags" TabTags "More" "More lists" TabMore>>'},
			{title: "TabMore", text: '<<tabs txtMoreTab "Missing" "Missing tiddlers" TabMoreMissing "Orphans" "Orphaned tiddlers" TabMoreOrphans "Shadowed" "Shadowed tiddlers" TabMoreShadowed>>'}
		];
	this.store.shadows.shadows = shadowShadowStore;
	for(t=0; t<shadowShadows.length; t++) {
		shadowShadowStore.addTiddler(new Tiddler(shadowShadows[t]));
	}
	// If in the browser, load the tiddlers built into the TiddlyWiki document
	if(this.isBrowser) {
		var storeArea = document.getElementById("storeArea"),
			tiddlers = this.store.deserializeTiddlers("(DOM)",storeArea);
		for(t=0; t<tiddlers.length; t++) {
			this.store.addTiddler(new Tiddler(tiddlers[t]));
		}
	}
	// Set up the JavaScript parser. Currently a hack; the idea is that the parsers would be loaded through a boot recipe
	if(this.isBrowser) {
		this.store.jsParser = new JavaScriptParser(this.store.getTiddlerText("javascript.pegjs"));
	} else {
		this.store.jsParser = new JavaScriptParser(require("fs").readFileSync("parsers/javascript.pegjs","utf8"));
	}
	// Bit of a hack to set up the macros
	this.store.installMacro(require("./macros/echo.js").macro);
	this.store.installMacro(require("./macros/image.js").macro);
	this.store.installMacro(require("./macros/info.js").macro);
	this.store.installMacro(require("./macros/link.js").macro);
	this.store.installMacro(require("./macros/list.js").macro);
	this.store.installMacro(require("./macros/slider.js").macro);
	this.store.installMacro(require("./macros/story.js").macro);
	this.store.installMacro(require("./macros/tiddler.js").macro);
	this.store.installMacro(require("./macros/version.js").macro);
	this.store.installMacro(require("./macros/view.js").macro);
	// Set up navigation if we're in the browser
	if(this.isBrowser) {
		// Install the standard navigators
		var navigators = new Navigators({
				document: document,
				store: this.store
			});
		navigators.registerNavigator("StoryNavigator",new StoryNavigator(navigators));
		// Use the story navigator for all links
		navigators.install("a","StoryNavigator");
		// Install an event handler for sliders
		document.addEventListener("click",function(e) {
			var el = e.target,
				matchesSelector = el.matchesSelector || el.mozMatchesSelector ||
					el.webkitMatchesSelector || el.oMatchesSelector || el.msMatchesSelector;
			if(matchesSelector && matchesSelector.call(el,".tw-slider-label")) {
				var currState = el.nextSibling.style.display;
				el.nextSibling.style.display = currState === "block" ? "none" : "block";
				e.preventDefault();
				return false;
			} else {
				return true;
			}
		},false);
		// Open the PageTemplate
		var div = document.createElement("div");
		div.innerHTML = this.store.renderTiddler("text/html","PageTemplate");
		document.body.appendChild(div);
		// Set up a timer to change the value of a tiddler
		var me = this;
		window.setInterval(function() {
			me.store.addTiddler(new Tiddler({
				title: "TiddlyWiki5",
				text: "This tiddler is new at " + (new Date()).toString()
			}));
		},3000);
		// Register an event handler to handle refreshing the DOM
		this.store.addEventListener("",function(changes) {
			me.store.refreshDomNode(div,changes);
		});
	}
};

exports.App = App;

})();
