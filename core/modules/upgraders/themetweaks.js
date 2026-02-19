/*\
title: $:/core/modules/upgraders/themetweaks.js
type: application/javascript
module-type: upgrader
\*/

"use strict";

var MAPPINGS = {
	"$:/themes/tiddlywiki/vanilla/metrics": {
		"fontsize": "$:/themes/tiddlywiki/vanilla/metrics/fontsize",
		"lineheight": "$:/themes/tiddlywiki/vanilla/metrics/lineheight",
		"storyleft": "$:/themes/tiddlywiki/vanilla/metrics/storyleft",
		"storytop": "$:/themes/tiddlywiki/vanilla/metrics/storytop",
		"storyright": "$:/themes/tiddlywiki/vanilla/metrics/storyright",
		"storywidth": "$:/themes/tiddlywiki/vanilla/metrics/storywidth",
		"tiddlerwidth": "$:/themes/tiddlywiki/vanilla/metrics/tiddlerwidth"
	},
	"$:/themes/tiddlywiki/vanilla/settings": {
		"fontfamily": "$:/themes/tiddlywiki/vanilla/settings/fontfamily"
	}
};

exports.upgrade = function(wiki,titles,tiddlers) {
	var self = this,
		messages = {};
	// Check for tiddlers on our list
	$tw.utils.each(titles,function(title) {
		var mapping = MAPPINGS[title];
		if(mapping) {
			var tiddler = new $tw.Tiddler(tiddlers[title]),
				tiddlerData = wiki.getTiddlerDataCached(tiddler,{});
			for(var index in mapping) {
				var mappedTitle = mapping[index];
				if(!tiddlers[mappedTitle] || tiddlers[mappedTitle].title !== mappedTitle) {
					tiddlers[mappedTitle] = {
						title: mappedTitle,
						text: tiddlerData[index]
					};
					messages[mappedTitle] = $tw.language.getString("Import/Upgrader/ThemeTweaks/Created",{variables: {
						from: title + "##" + index
					}});
				}
			}
		}
	});
	return messages;
};
