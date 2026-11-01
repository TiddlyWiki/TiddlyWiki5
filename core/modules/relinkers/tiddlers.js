/*\
title: $:/core/modules/relinkers/tiddlers.js
type: application/javascript
module-type: relinker

Relinks the tags and list fields of tiddlers.

Calls a tw-relinking-tiddler hook for every altered tiddler.

\*/

exports.name = "tiddlers";

exports.relink = function(wiki,fromTitle,toTitle,options) {
	wiki.each(function(tiddler,title) {
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
				var newTiddler = new $tw.Tiddler(tiddler,{tags: tags, list: list},wiki.getModificationFields());
				newTiddler = $tw.hooks.invokeHook("th-relinking-tiddler",newTiddler,tiddler);
				wiki.addTiddler(newTiddler);
			}
		}
	});
};
