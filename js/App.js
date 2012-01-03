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
	WikiTextProcessor = require("./WikiTextProcessor.js").WikiTextProcessor,
	Sandbox = require("./Sandbox.js").Sandbox,
	Navigators = require("./Navigators.js").Navigators,
	StoryNavigator = require("./StoryNavigator.js").StoryNavigator;

var App = function() {
	var t;
	// Check if we're running on the server or the client
	this.isBrowser = typeof window !== "undefined";
	// Create the main store
	this.store = new WikiStore();	
	// Register the wikitext processor
	this.store.registerTextProcessor("text/x-tiddlywiki",new WikiTextProcessor({
		store: this.store
	}));
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
			{title: "WindowTitle", text: "<<tiddler SiteTitle>> - <<tiddler SiteSubtitle>>"},
			{title: "DefaultTiddlers", text: "[[GettingStarted]]"},
			{title: "MainMenu", text: "[[GettingStarted]]"},
			{title: "SiteTitle", text: "My TiddlyWiki"},
			{title: "SiteSubtitle", text: "a reusable non-linear personal web notebook"},
			{title: "SiteUrl", text: ""}
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
	// Set up the sandbox for JavaScript parsing
	if(this.isBrowser) {
		this.store.sandbox = new Sandbox(this.store.getTiddlerText("javascript.pegjs"));
	} else {
		this.store.sandbox = new Sandbox(require("fs").readFileSync("parsers/javascript.pegjs","utf8"));
	}
	// Hack to install standard macros
	this.store.installMacros();
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
