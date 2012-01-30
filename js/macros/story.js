/*\
title: js/macros/story.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "story",
	types: ["text/html","text/plain"],
	params: {
		story: {byName: "default", type: "tiddler", optional: false},
		template: {byName: true, type: "tiddler", optional: true}
	},
	render: function(type,tiddler,store,params) {
		var tiddlers = store.getTiddlerText(params.story).split("\n"),
			t,
			output = [];
		for(t=0; t<tiddlers.length; t++) {
			var title = tiddlers[t].trim();
			if(title !== "") {
				if(params.template) {
					output.push(store.renderTiddler(type,params.template,title));
				} else {
					output.push(store.renderTiddler(type,title));
				}
			}
		}
		return output.join("\n");
	}
};

})();

