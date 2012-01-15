/*\
title: js/macros/link.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "link",
	wrapperTag: "span",
	types: ["text/html","text/plain"],
	params: {
		target: {byName: "default", type: "tiddler", optional: false},
		text: {byName: true, type: "text", optional: true}
	},
	handler: function(type,tiddler,store,params) {
		var text = params.text || params.target;
		if(type === "text/html") {
			return utils.stitchElement("a",{
				href: params.target
			},{
				content: utils.htmlEncode(text),
				classNames: store.adjustClassesForLink([],params.target)
			});
		} else if (type === "text/plain") {
			return text;	
		}
	}
};

})();
