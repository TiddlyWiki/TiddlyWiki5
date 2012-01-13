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
		story: {byName: "default", type: "text", optional: false},
		template: {byName: true, type: "text", optional: true}
	},
	code: function(type,tiddler,store,params) {
		var templateType = "text/x-tiddlywiki",
			templateText = "<<view text wikified>>",
			template = params.template ? store.getTiddler(params.template) : null,
			tiddlers = store.getTiddlerText(params.story).split("\n"),
			t,
			output = [];
		if(template) {
			templateType = template.fields.type;
			templateText = template.fields.text;
		}
		for(t=0; t<tiddlers.length; t++) {
			var title = tiddlers[t].trim();
			if(title !== "") {
				output.push("<article>");
				output.push(store.renderText(templateType,templateText,"text/html",title));
				output.push("</article>");
			}
		}
		return output.join("\n");
	}
};

})();

