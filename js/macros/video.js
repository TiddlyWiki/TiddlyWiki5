/*\
title: js/macros/video.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

exports.macro = {
	name: "video",
	types: ["text/html","text/plain"],
	params: {
		src: {byName: "default", type: "text"},
		type: {byName: true, type: "text"},
		width: {byName: true, type: "text"},
		height: {byName: true, type: "text"}
	},
	execute: function(macroNode,tiddler,store) {
		var src = macroNode.params.src,
			videoType = macroNode.params.type || "vimeo",
			videoWidth = macroNode.params.width || 640,
			videoHeight = macroNode.params.height || 360;
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
