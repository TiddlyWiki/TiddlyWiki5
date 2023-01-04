/*\
title: $:/core/modules/server/routes/put-tiddler.js
type: application/javascript
module-type: route

PUT /recipes/default/tiddlers/:title

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "PUT";

exports.path = /^\/recipes\/default\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	$tw.perf.reset();
	$tw.perf.timer("parse-tiddler-content", "Decode and parseJSONSafe");
	var title = $tw.utils.decodeURIComponentSafe(state.params[0]),
	fields = $tw.utils.parseJSONSafe(state.data);
	// Pull up any subfields in the `fields` object
	if(fields.fields) {
		$tw.utils.each(fields.fields,function(field,name) {
			fields[name] = field;
		});
		delete fields.fields;
	}
	// Remove any revision field
	if(fields.revision) {
		delete fields.revision;
	}
	$tw.perf.timer("parse-tiddler-content");
	// If this is a skinny tiddler, it means the client never got the full
	// version of the tiddler to edit. So we must preserve whatever text
	// already exists on the server, or else we'll inadvertently delete it.
	if(fields._is_skinny !== undefined) {
		$tw.perf.timer("get-skinny", "Restore text on server");
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			fields.text = tiddler.fields.text;
		}
		delete fields._is_skinny;
		$tw.perf.timer("get-skinny");
	}
	$tw.perf.timer("add-tiddler", "new Tiddler instance and add to wiki");
	state.wiki.addTiddler(new $tw.Tiddler(fields,{title: title}));
	$tw.perf.timer("add-tiddler");
	$tw.perf.timer("count-change", "Construct etag using changed count of tiddler");
	var changeCount = state.wiki.getChangeCount(title).toString();
	$tw.perf.timer("count-change");
	response.writeHead(204, "OK",{
		Etag: "\"default/" + encodeURIComponent(title) + "/" + changeCount + ":\"",
		"Content-Type": "text/plain",
		"Server-Timing": $tw.perf.generateHeader() || ""
	});
	response.end();
};

}());
