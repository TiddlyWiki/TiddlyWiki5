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
	JavaScriptParser = require("./JavaScriptParser.js").JavaScriptParser,
	SVGParser = require("./SVGParser.js").SVGParser,
	BitmapParser = require("./BitmapParser.js").BitmapParser,
	Navigators = require("./Navigators.js").Navigators,
	StoryNavigator = require("./StoryNavigator.js").StoryNavigator;

var App = function() {
	var t;
	// Check if we're running on the server or the client
	this.isBrowser = typeof window !== "undefined";
	// Create the main store
	this.store = new WikiStore();	
	// Register the wikitext parser and the SVG parser
	this.store.registerParser("text/x-tiddlywiki",new WikiTextParser({
		store: this.store
	}));
	this.store.registerParser("image/svg+xml",new SVGParser());
	var bitmapParser = new BitmapParser();
	this.store.registerParser("image/jpg",bitmapParser);
	this.store.registerParser("image/jpeg",bitmapParser);
	this.store.registerParser("image/png",bitmapParser);
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
	// Set up the JavaScript parser
	if(this.isBrowser) {
		this.store.jsParser = new JavaScriptParser(this.store.getTiddlerText("javascript.pegjs"));
	} else {
		this.store.jsParser = new JavaScriptParser(require("fs").readFileSync("parsers/javascript.pegjs","utf8"));
	}
	// Bit of a hack to set up the macros
	this.store.installMacro(require("./macros/echo.js").macro);
	this.store.installMacro(require("./macros/info.js").macro);
	this.store.installMacro(require("./macros/list.js").macro);
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
		// Navigate to HelloThere
		navigators.navigateTo("HelloThere","StoryNavigator");
	}
};

exports.App = App;

})();
