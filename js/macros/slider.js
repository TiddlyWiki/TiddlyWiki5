/*\
title: js/macros/slider.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "slider",
	types: ["text/html","text/plain"],
	params: {
		name: {byPos: 0, type: "text", optional: false},
		targetTiddler: {byPos: 1, type: "tiddler", optional: false},
		label: {byPos: 2, type: "text", optional: false},
		tooltip: {byPos: 3, type: "text", optional: true}
	},
	handler: function(type,tiddler,store,params) {
		if(type === "text/html") {
			var sliderHandle = utils.stitchElement("div",params.tooltip ? {
					title: utils.htmlEncode(params.tooltip)
				} : null,{
					content: utils.htmlEncode(params.label),
					classNames: ["tw-slider-handle"]
				}),
				sliderBody = utils.stitchElement("div",{
					style: {
						display: "block"
					}
				},{
					content: store.renderTiddler(type,params.targetTiddler),
					classNames: ["tw-slider-body"]
				});
			return utils.stitchElement("div",null,{
				content: sliderHandle + sliderBody,
				classNames: ["tw-slider"]
			});
		} else if(type === "text/plain") {
			return store.renderTiddler(type,params.target);
		}
		return null;	
	}
};

})();

