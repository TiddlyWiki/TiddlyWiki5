/*\
title: js/Main.js

This is the main() function in the browser

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var WikiStore = require("./WikiStore.js").WikiStore,
	Tiddler = require("./Tiddler.js").Tiddler,
	tiddlerInput = require("./TiddlerInput.js"),
	tiddlerOutput = require("./TiddlerOutput.js"),
	TextProcessors = require("./TextProcessors.js").TextProcessors,
	WikiTextProcessor = require("./WikiTextProcessor.js").WikiTextProcessor,
	TiddlerConverters = require("./TiddlerConverters.js").TiddlerConverters,
	Navigators = require("./Navigators.js").Navigators,
	StoryNavigator = require("./StoryNavigator.js").StoryNavigator;

var textProcessors = new TextProcessors(),
	tiddlerConverters = new TiddlerConverters(),
	store = new WikiStore({
		textProcessors: textProcessors
	}),
	t;

// Register the wikitext processor
textProcessors.registerTextProcessor("text/x-tiddlywiki",new WikiTextProcessor({
	textProcessors: textProcessors
}));

// Register the standard tiddler serializers and deserializers
tiddlerInput.register(tiddlerConverters);
tiddlerOutput.register(tiddlerConverters);

// Add the shadow tiddlers that are built into TiddlyWiki
var shadowShadowStore = new WikiStore({
		textProcessors: textProcessors,
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
store.shadows.shadows = shadowShadowStore;
for(t=0; t<shadowShadows.length; t++) {
	shadowShadowStore.addTiddler(new Tiddler(shadowShadows[t]));
}

// Load the tiddlers built into the TiddlyWiki document
var storeArea = document.getElementById("storeArea"),
	tiddlers = tiddlerConverters.deserialize("(DOM)",storeArea);
for(t=0; t<tiddlers.length; t++) {
	store.addTiddler(new Tiddler(tiddlers[t]));
}

// Install the standard navigators
var navigators = new Navigators({
		document: document,
		store: store
	});

navigators.registerNavigator("StoryNavigator",new StoryNavigator(navigators));
// Use the story navigator for all links
navigators.install("a","StoryNavigator");

// Navigate to HelloThere
navigators.navigateTo("HelloThere","StoryNavigator");

})();
