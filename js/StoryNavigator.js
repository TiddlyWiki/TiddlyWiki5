/*\
title: js/StoryNavigator.js

This browser component manages navigating to new tiddlers in a TiddlyWiki classic story style

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler;

var StoryNavigator = function(navigators) {
	this.navigators = navigators;
};

StoryNavigator.prototype.navigateTo = function(title) {
	var store = this.navigators.store,
		tiddler = store.getTiddler(title),
		storyTiddler = store.getTiddler("StoryTiddlers"); // This is a hack, obviously
	if(tiddler) {
		store.addTiddler(new Tiddler(storyTiddler,{text: title + "\n" + storyTiddler.text}));
		$("html,body").animate({
			scrollTop: 0
		}, 400);
		return false;
	} else {
		return true;		
	}
};

exports.StoryNavigator = StoryNavigator;

})();
