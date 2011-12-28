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
	WikiTextProcessor = require("./WikiTextProcessor.js").WikiTextProcessor,
	Navigators = require("./Navigators.js").Navigators,
	StoryNavigator = require("./StoryNavigator.js").StoryNavigator;

var store = new WikiStore(),
	t;

// Register the wikitext processor
store.registerTextProcessor("text/x-tiddlywiki",new WikiTextProcessor({
	store: store
}));

// Register the standard tiddler serializers and deserializers
tiddlerInput.register(store);
tiddlerOutput.register(store);

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
		{title: "WindowTitle", text: "<<tiddler SiteTitle>> - <<tiddler SiteSubtitle>>"},
		{title: "DefaultTiddlers", text: "[[GettingStarted]]"},
		{title: "MainMenu", text: "[[GettingStarted]]"},
		{title: "SiteTitle", text: "My TiddlyWiki"},
		{title: "SiteSubtitle", text: "a reusable non-linear personal web notebook"},
		{title: "SiteUrl", text: ""}
	];
store.shadows.shadows = shadowShadowStore;
for(t=0; t<shadowShadows.length; t++) {
	shadowShadowStore.addTiddler(new Tiddler(shadowShadows[t]));
}

// Load the tiddlers built into the TiddlyWiki document
var storeArea = document.getElementById("storeArea"),
	tiddlers = store.deserializeTiddlers("(DOM)",storeArea);
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
