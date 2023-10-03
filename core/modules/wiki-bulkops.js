/*\
title: $:/core/modules/wiki-bulkops.js
type: application/javascript
module-type: wikimethod

Bulk tiddler operations such as rename.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Rename a tiddler, and relink any tags or lists that reference it.
*/
function renameTiddler(fromTitle,toTitle,options) {
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	options = options || {};
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		// Rename the tiddler itself
		var oldTiddler = this.getTiddler(fromTitle),
			newTiddler = new $tw.Tiddler(oldTiddler,{title: toTitle},this.getModificationFields());
		newTiddler = $tw.hooks.invokeHook("th-renaming-tiddler",newTiddler,oldTiddler);
		this.addTiddler(newTiddler);
		this.deleteTiddler(fromTitle);
		// Rename any tags or lists that reference it
		this.relinkTiddler(fromTitle,toTitle,options)
	}
}

/*
Relink any tags or lists that reference a given tiddler
*/
function relinkTiddler(fromTitle,toTitle,options) {
	var self = this;
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	options = options || {};
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		this.each(function(tiddler,title) {
			var type = tiddler.fields.type || "";
			// Don't touch plugins or JavaScript modules
			if(!tiddler.fields["plugin-type"] && type !== "application/javascript") {
				var tags = tiddler.fields.tags ? tiddler.fields.tags.slice(0) : undefined,
					list = tiddler.fields.list ? tiddler.fields.list.slice(0) : undefined,
					isModified = false,
					processList = function(listField) {
						if(listField && listField.indexOf(fromTitle) !== -1) {
							// Remove any existing instances of the toTitle
							var p = listField.indexOf(toTitle);
							while(p !== -1) {
								listField.splice(p,1);
								p = listField.indexOf(toTitle);
							}
							// Replace the fromTitle with toTitle
							$tw.utils.each(listField,function (title,index) {
								if(title === fromTitle) {
									listField[index] = toTitle;
									isModified = true;
								}
							});
						}
					};
				if(!options.dontRenameInTags) {
					// Rename tags
					processList(tags);
				}
				if(!options.dontRenameInLists) {
					// Rename lists
					processList(list);
				}
				if(isModified) {
					var newTiddler = new $tw.Tiddler(tiddler,{tags: tags, list: list},self.getModificationFields())
					newTiddler = $tw.hooks.invokeHook("th-relinking-tiddler",newTiddler,tiddler);
					self.addTiddler(newTiddler);
				}
			}
		});
	}
};

exports.renameTiddler = renameTiddler;
exports.relinkTiddler = relinkTiddler;

})();
