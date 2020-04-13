/*\
title: $:/core/modules/server/routes/get-tags-json.js
type: application/javascript
module-type: route

GET /recipes/default/tags.json?filter=<filter>

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_FILTER = "[tags[]!is[system]sort[title]]";

exports.method = "GET";

exports.path = /^\/recipes\/default\/tags.json$/;

exports.handler = function(request,response,state) {
	let countTaggedTiddlers = state.queryParameters.count_tagged_tiddlers
	var filter = state.queryParameters.filter || DEFAULT_FILTER;
	if($tw.wiki.getTiddlerText("$:/config/Server/AllowAllExternalFilters") !== "yes") {
		if($tw.wiki.getTiddlerText("$:/config/Server/ExternalFilters/" + filter) !== "yes") {
			console.log("Blocked attempt to GET /recipes/default/tags.json with filter: " + filter);
			response.writeHead(403);
			response.end();
			return;
		}
	}
	let excludeFields = (state.queryParameters.exclude || "text").split(",");
	let	titles = state.wiki.filterTiddlers(filter);
	response.writeHead(200, {"Content-Type": "application/json"});
	var entries = [];
	$tw.utils.each(titles,function(title) {
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			let entry = tiddler.getFieldStrings({exclude: excludeFields});
			entry.revision = state.wiki.getChangeCount(title);
			entry.type = entry.type || "text/vnd.tiddlywiki";
			entry.tiddlerExists = true;
			if (countTaggedTiddlers === "true") {
				entry.taggedCount = state.wiki.filterTiddlers(`[tag[${title}]]`).length;
			}
			entries.push(entry);
		}
		else {
			let entry = {};
			entry.title = title
			entry.tiddlerExists = false;
			if (countTaggedTiddlers === "true") {
				entry.taggedCount = state.wiki.filterTiddlers(`[tag[${title}]]`).length;
			}
			entries.push(entry);
		}
	});
	var text = JSON.stringify(entries);
	response.end(text,"utf8");
};

}());
