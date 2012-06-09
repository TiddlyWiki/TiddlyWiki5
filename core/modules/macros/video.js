/*\
title: $:/core/modules/macros/video.js
type: application/javascript
module-type: macro

Video macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "video",
	params: {
		src: {byName: "default", type: "text"},
		type: {byName: true, type: "text"},
		width: {byName: true, type: "text"},
		height: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var src = this.params.src,
		videoType = this.params.type || "vimeo",
		videoWidth = this.params.width || 640,
		videoHeight = this.params.height || 360;
	switch(videoType) {
		case "vimeo":
			return $tw.Tree.Element("iframe",{
				src: "http://player.vimeo.com/video/" + src + "?autoplay=0",
				width: videoWidth,
				height: videoHeight,
				frameborder: 0
			});
		case "youtube":
			return $tw.Tree.Element("iframe",{
				type: "text/html",
				src: "http://www.youtube.com/embed/" + src,
				width: videoWidth,
				height: videoHeight,
				frameborder: 0
			});
		case "archiveorg":
			return $tw.Tree.Element("iframe",{
				src: "http://www.archive.org/embed/" + src,
				width: videoWidth,
				height: videoHeight,
				frameborder: 0
			});
		default:
			return null;
	}
};

})();
