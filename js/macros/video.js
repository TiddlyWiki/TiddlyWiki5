/*\
title: js/macros/video.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "video",
	types: ["text/html","text/plain"],
	params: {
		src: {byName: "default", type: "text", optional: false},
		type: {byName: true, type: "text", optional: true},
		width: {byName: true, type: "text", optional: true},
		height: {byName: true, type: "text", optional: true}
	},
	render: function(type,tiddler,store,params) {
		var videoType = params.type || "vimeo",
			videoWidth = params.width || 640,
			videoHeight = params.height || 360;
		if(type === "text/html") {
			switch(videoType) {
				case "vimeo":
					return "<iframe src='http://player.vimeo.com/video/" + params.src + "?autoplay=0' width='" + videoWidth + "' height='" + videoHeight + "' frameborder='0'></iframe>";
				case "youtube":
					return "<iframe type='text/html' width='" + videoWidth + "' height='" + videoHeight + "' src='http://www.youtube.com/embed/" + params.src + "' frameborder='0'></iframe>";
				case "archiveorg":
					return "<iframe src='http://www.archive.org/embed/" + params.src + "' width='" + videoWidth + "' height='" + videoHeight + "' frameborder='0'></iframe>";
			}
		} else if (type === "text/plain") {
			return ""; // Not really sure how to render a video into plain text...
		}
	}
};

})();
