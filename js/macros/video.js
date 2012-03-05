/*\
title: js/macros/video.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

exports.macro = {
	name: "video",
	params: {
		src: {byName: "default", type: "text"},
		type: {byName: true, type: "text"},
		width: {byName: true, type: "text"},
		height: {byName: true, type: "text"}
	},
	execute: function() {
		var src = this.params.src,
			videoType = this.params.type || "vimeo",
			videoWidth = this.params.width || 640,
			videoHeight = this.params.height || 360;
		switch(videoType) {
			case "vimeo":
				return [Renderer.ElementNode("iframe",{
					src: "http://player.vimeo.com/video/" + src + "?autoplay=0",
					width: videoWidth,
					height: videoHeight,
					frameborder: 0
				})];
			case "youtube":
				return [Renderer.ElementNode("iframe",{
					type: "text/html",
					src: "http://www.youtube.com/embed/" + src,
					width: videoWidth,
					height: videoHeight,
					frameborder: 0
				})];
			case "archiveorg":
				return [Renderer.ElementNode("iframe",{
					src: "http://www.archive.org/embed/" + src,
					width: videoWidth,
					height: videoHeight,
					frameborder: 0
				})];
			default:
				return [];
		}
	}
};

})();
