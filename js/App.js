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
	Renderer = require("./Renderer.js").Renderer,
	WikiTextParser = require("./WikiTextParser.js").WikiTextParser,
	PlainTextParser = require("./PlainTextParser.js").PlainTextParser,
	JavaScriptParser = require("./JavaScriptParser.js").JavaScriptParser,
	JSONParser = require("./JSONParser.js").JSONParser,
	ImageParser = require("./ImageParser.js").ImageParser;

var App = function() {
	var t;
	// Check if we're running on the server or the client
	this.isBrowser = typeof window !== "undefined";
	// Create the main store
	this.store = new WikiStore();	
	// Register the parsers
	this.store.registerParser("text/x-tiddlywiki",new WikiTextParser({store: this.store}));
	this.store.registerParser("text/plain",new PlainTextParser({store: this.store}));
	this.store.registerParser(["image/svg+xml",".svg","image/jpg",".jpg","image/jpeg",".jpeg","image/png",".png","image/gif",".gif"],new ImageParser({store: this.store}));
	this.store.registerParser(["application/javascript",".js"],new JavaScriptParser({store: this.store}));
	this.store.registerParser(["application/json",".json"],new JSONParser({store: this.store}));
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
		// First, the JavaScript system tiddlers
		var moduleArea = document.getElementById("jsModules"),
			tiddlers = this.store.deserializeTiddlers("(DOM)",moduleArea);
		for(t=0; t<tiddlers.length; t++) {
			this.store.addTiddler(new Tiddler(tiddlers[t]));
		}
		// Then, the ordinary tiddlers baked into the storeArea
		var storeArea = document.getElementById("storeArea");
		tiddlers = this.store.deserializeTiddlers("(DOM)",storeArea);
		for(t=0; t<tiddlers.length; t++) {
			this.store.addTiddler(new Tiddler(tiddlers[t]));
		}
	}
	// Bit of a hack to set up the macros
	this.store.installMacro(require("./macros/chooser.js").macro);
	this.store.installMacro(require("./macros/echo.js").macro);
	this.store.installMacro(require("./macros/image.js").macro);
	this.store.installMacro(require("./macros/link.js").macro);
	this.store.installMacro(require("./macros/list.js").macro);
	this.store.installMacro(require("./macros/slider.js").macro);
	this.store.installMacro(require("./macros/story.js").macro);
	this.store.installMacro(require("./macros/tiddler.js").macro);
	this.store.installMacro(require("./macros/version.js").macro);
	this.store.installMacro(require("./macros/video.js").macro);
	this.store.installMacro(require("./macros/view.js").macro);
	// Set up navigation if we're in the browser
	if(this.isBrowser) {
		// Open the PageTemplate
		var renderer = this.store.renderMacro("tiddler",{target: "PageTemplate"});
		renderer.renderInDom(document.body);
		// Register an event handler to handle refreshing the DOM
		this.store.addEventListener("",function(changes) {
			renderer.refreshInDom(changes);
		});
		// Set the page title and refresh it when needed
		var titleRenderer = this.store.renderMacro("tiddler",{target: "WindowTitle"});
		document.title = titleRenderer.render("text/plain");
		this.store.addEventListener("",function(changes) {
			titleRenderer.refresh(changes);
			document.title = titleRenderer.render("text/plain");
		});
		// Set up a timer to change the value of a tiddler
		var me = this;
		window.setInterval(function() {
			me.store.addTiddler(new Tiddler({
				title: "ClockTiddler",
				text: "The time was recently " + (new Date()).toString()
			}));
		},3000);
		// Listen for navigate events that weren't caught
		document.addEventListener("tw-navigate",function (event) {
			renderer.broadcastEvent(event);
		},false);
	}
};

exports.App = App;

})();
