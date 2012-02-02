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

StoryNavigator.prototype.navigateTo = function(title,event) {
	var store = this.navigators.store,
		tiddler = store.getTiddler(title);
	if(tiddler) {
		store.invokeMacroMethod(event.target,"navigateTo",{
			event: event,
			target: title
		});
		return false;
	} else {
		return true;		
	}
};

exports.StoryNavigator = StoryNavigator;

})();
