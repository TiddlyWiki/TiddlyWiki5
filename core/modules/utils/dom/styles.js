/*\
title: $:/core/modules/utils/styles.js
type: application/javascript
module-type: utils

The stylesheet manager automatically renders any tiddlers tagged "$:/tags/stylesheet" as HTML style elements.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var STYLESHEET_ID_PREFIX = "tw-tiddler-stylesheet-",
	STYLESHEET_TAG = "$:/tags/stylesheet";

function StylesheetManager(wiki) {
	this.wiki = wiki;
	this.stylesheets = {}; // Hashmap of currently rendered stylesheets
	// Apply initial stylesheets
	var self = this,
		stylesheetTiddlers = this.wiki.filterTiddlers("[is[shadow]!has[draft.of]tag[" + STYLESHEET_TAG + "]] [!is[shadow]!has[draft.of]tag[" + STYLESHEET_TAG + "]]");
	$tw.utils.each(stylesheetTiddlers,function(title,index) {
		self.addStylesheet(title);
	});
	// Listen out for changes
	this.wiki.addEventListener("change",function(changes) {
		self.handleTiddlerChanges(changes);
	});
}

StylesheetManager.prototype.addStylesheet = function(title) {
	// Record the stylesheet in the hashmap
	this.stylesheets[title] = true;
	// Parse the tiddler and render as plain text
	var text = this.wiki.new_renderTiddler("text/plain",title);
	// Create a style element and put it in the document
	var styleNode = document.createElement("style");
	styleNode.setAttribute("type","text/css");
	styleNode.setAttribute("id",STYLESHEET_ID_PREFIX + title);
	styleNode.appendChild(document.createTextNode(text));
	document.getElementsByTagName("head")[0].appendChild(styleNode);
};

StylesheetManager.prototype.removeStylesheet = function(title) {
	// Remove the stylesheet from the hashmap
	if($tw.utils.hop(this.stylesheets,title)) {
		delete this.stylesheets[title];
	}
	// Remove the stylesheet from the document
	var styleNode = document.getElementById(STYLESHEET_ID_PREFIX + title);
	if(styleNode) {
		styleNode.parentNode.removeChild(styleNode);
	}
};

StylesheetManager.prototype.handleTiddlerChanges = function(changes) {
	var self = this;
	$tw.utils.each(changes,function(change,title) {
		// Remove any existing stylesheet for the changed tiddler
		if($tw.utils.hop(self.stylesheets,title)) {
			self.removeStylesheet(title);
		}
		// Add the stylesheet if it is tagged and not a draft
		var tiddler = self.wiki.getTiddler(title);
		if(tiddler && tiddler.hasTag(STYLESHEET_TAG) && !tiddler.hasField("draft.of")) {
			self.addStylesheet(title);
		}
	});
};

exports.StylesheetManager = StylesheetManager;

})();
