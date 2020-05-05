/*\
title: $:/core/modules/server/routes/get-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers.json?filter=<filter>

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_FILTER = "[all[tiddlers]!is[system]sort[title]]";
var DEFAULT_INCLUDE_NON_TIDDLERS = false;

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json$/;

exports.handler = function(request,response,state) {
	var filter = state.queryParameters.filter || DEFAULT_FILTER;
	var include_non_tiddlers = state.queryParameters.include_non_tiddlers || DEFAULT_INCLUDE_NON_TIDDLERS;
	if($tw.wiki.getTiddlerText("$:/config/Server/AllowAllExternalFilters") !== "yes") {
		if($tw.wiki.getTiddlerText("$:/config/Server/ExternalFilters/" + filter) !== "yes") {
			console.log("Blocked attempt to GET /recipes/default/tiddlers.json with filter: " + filter);
			response.writeHead(403);
			response.end();
			return;
		}
	}
	var excludeFields = (state.queryParameters.exclude || "text").split(","),
		titles = state.wiki.filterTiddlers(filter);
	response.writeHead(200, {"Content-Type": "application/json"});
	var response_body = [];
	$tw.utils.each(titles,function(title) {
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			var tiddlerFields = tiddler.getFieldStrings({exclude: excludeFields});
			tiddlerFields.revision = state.wiki.getChangeCount(title);
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			response_body.push(tiddlerFields);
		} else {
			if(include_non_tiddlers) {
				let entry = {};
				entry.title = title
				entry.non_tiddler = true;
				response_body.push(entry);
			}
		}
	});
	var text = JSON.stringify(response_body);
	response.end(text,"utf8");
};

}());
