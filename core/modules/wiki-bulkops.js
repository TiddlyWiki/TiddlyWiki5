/*\
title: $:/core/modules/wiki-bulkops.js
type: application/javascript
module-type: wikimethod

Bulk tiddler operations such as rename.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: true */
"use strict";

/*
Retarget tags and lists from fromTitle toTitle.
*/
exports.retargetReferences = function(fromTitle,toTitle) {
	var self = this;
	// Rename any tags or lists that reference it
	this.each(function(tiddler,title) {
		var tags = (tiddler.fields.tags || []).slice(0),
				list = (tiddler.fields.list || []).slice(0),
				isModified = false;
		// Rename tags
		$tw.utils.each(tags,function (title,index) {
			if(title === fromTitle) {
				tags[index] = toTitle;
				isModified = true;
			}
		});
		// Rename lists
		$tw.utils.each(list,function (title,index) {
			if(title === fromTitle) {
				list[index] = toTitle;
				isModified = true;
			}
		});
		if(isModified) {
			self.addTiddler(new $tw.Tiddler(tiddler,{tags: tags, list: list},self.getModificationFields()));
		}
	});
}

$tw.hooks.addHook("th-renaming-tiddler",function(params) {
	$tw.wiki.retargetReferences(params.fromTitle, params.toTitle);
	// Otherwise the next function in the chain gets params = null
	return params;
});

/*
Rename a tiddler, and relink any tags or lists that reference it.
*/
exports.renameTiddler = function(fromTitle,toTitle) {
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		// Rename the tiddler itself
		var tiddler = this.getTiddler(fromTitle);
		this.addTiddler(new $tw.Tiddler(tiddler,{title: toTitle},this.getModificationFields()));
		this.deleteTiddler(fromTitle);
		this.retargetReferences(fromTitle, toTitle)
	}
}

})();
