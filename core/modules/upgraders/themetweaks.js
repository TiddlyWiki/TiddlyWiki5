/*\
title: $:/core/modules/upgraders/themetweaks.js
type: application/javascript
module-type: upgrader

Upgrader module that handles the change in theme tweak storage introduced in 5.0.14-beta.

Previously, theme tweaks were stored in two data tiddlers:

* $:/themes/tiddlywiki/vanilla/metrics
* $:/themes/tiddlywiki/vanilla/settings

Now, each tweak is stored in its own separate tiddler.

This upgrader copies any values from the old format to the new. The old data tiddlers are not deleted in case they have been used to store additional indexes.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
				tiddlerData = wiki.getTiddlerData(tiddler,{});
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

})();
