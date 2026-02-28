/*\
title: $:/core/modules/wiki-bulkops.js
type: application/javascript
module-type: wikimethod

Bulk tiddler operations such as rename.

\*/

"use strict";

var relinkers = $tw.modules.getModulesByTypeAsHashmap("relinker");
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
		this.relinkTiddler(fromTitle,toTitle,options);
	}
}

/*
Relink any tags or lists that reference a given tiddler
*/
function relinkTiddler(fromTitle,toTitle,options) {
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	options = options || {};
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		for (var name in relinkers) {
			relinkers[name].relink(this,fromTitle,toTitle,options);
		}
	}
};

exports.renameTiddler = renameTiddler;
exports.relinkTiddler = relinkTiddler;
