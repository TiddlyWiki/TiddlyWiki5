/*\
title: $:/core/modules/server/routes/get-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers/tiddlers.json

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function getTiddlerFields(tiddler, state, title) {
	var tiddlerFields = {};
	$tw.utils.each(tiddler.fields, function (field, name) {
		if (name !== "text") {
			tiddlerFields[name] = tiddler.getFieldString(name);
		}
	});
	tiddlerFields.revision = state.wiki.getChangeCount(title);
	tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
	return tiddlerFields;
}

function getAllTiddlers(state) {
	var tiddlers = [];
	state.wiki.forEachTiddler({sortField: "title"},function(title,tiddler) {
		var tiddlerFields = getTiddlerFields(tiddler, state, title);
		tiddlers.push(tiddlerFields);
	});
	return tiddlers;
}

function getFilteredTiddlers(state, filter) {
	var tiddlers = [];
	$tw.utils.each(
		state.wiki.filterTiddlers(filter),
		function(title) {
			var tiddler = state.wiki.getTiddler(title);
			if (!tiddler) {
				return;
			}
			var tiddlerFields = getTiddlerFields(tiddler, state, title);
			tiddlers.push(tiddlerFields);
		}
	);
	return tiddlers;
}

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json(:.*)?$/;

exports.handler = function(request,response,state) {
	response.writeHead(200, {"Content-Type": "application/json"});
	var filter = state.params[0];
	var tiddlers;
	if(filter) {
		filter = decodeURIComponent(state.params[0]).substring(1);
		tiddlers = getFilteredTiddlers(state, filter);
	} else {
		tiddlers = getAllTiddlers(state);
	}
	var text = JSON.stringify(tiddlers);
	response.end(text,"utf8");
};

}());
