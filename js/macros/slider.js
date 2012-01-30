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
	render: function(type,tiddler,store,params) {
		if(type === "text/html") {
			return utils.stitchSlider(type,
										params.label,
										params.tooltip,
										store.renderTiddler(type,params.targetTiddler));
		} else if(type === "text/plain") {
			return store.renderTiddler(type,params.target);
		}
		return null;	
	}
};

})();

