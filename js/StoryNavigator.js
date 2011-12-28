/*\
title: js/StoryNavigator.js

This browser component manages navigating to new tiddlers in a TiddlyWiki classic story style

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var StoryNavigator = function(navigators) {
	this.navigators = navigators;
};

StoryNavigator.prototype.navigateTo = function(title) {
	var tiddlerHtml = this.navigators.store.renderTiddler("text/html","SimpleTemplate",title);
	if(tiddlerHtml) {
		var article = $("<article/>").html(tiddlerHtml);
		article.appendTo("body");
		$("html,body").animate({
			scrollTop: article.offset().top
		}, 400);
		return false;
	} else {
		return true;		
	}
};

exports.StoryNavigator = StoryNavigator;

})();
