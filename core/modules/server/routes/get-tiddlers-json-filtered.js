/*\
title: $:/core/modules/server/routes/get-tiddlers-json-filtered.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers.json::filter

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json:(.+)$/;

exports.handler = function(request,response,state) {
	var filter = decodeURIComponent(state.params[0]);
	response.writeHead(200, {"Content-Type": "application/json"});
	var tiddlers = [];
	$tw.utils.each(
		state.wiki.filterTiddlers(filter),
		function(title) {
			var tiddler = state.wiki.getTiddler(title);
			if(!tiddler) {
				return;
			}
			var tiddlerFields = {};
			$tw.utils.each(tiddler.fields,function(field,name) {
				if(name !== "text") {
					tiddlerFields[name] = tiddler.getFieldString(name);
				}
			});
			tiddlerFields.revision = state.wiki.getChangeCount(title);
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			tiddlers.push(tiddlerFields);
		}
	);
	var text = JSON.stringify(tiddlers);
	response.end(text,"utf8");
};

}());
