/*\
title: $:/core/modules/server/routes/put-tiddler.js
type: application/javascript
module-type: route

PUT /recipes/default/tiddlers/:title

\*/
"use strict";

exports.methods = ["PUT"];

exports.path = /^\/recipes\/default\/tiddlers\/(.+)$/;

exports.info = {
	priority: 100
};

exports.handler = function(request,response,state) {
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
	// If this is a skinny tiddler, it means the client never got the full
	// version of the tiddler to edit. So we must preserve whatever text
	// already exists on the server, or else we'll inadvertently delete it.
	if(fields._is_skinny !== undefined) {
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			fields.text = tiddler.fields.text;
		}
		delete fields._is_skinny;
	}
	state.wiki.addTiddler(new $tw.Tiddler(fields,{title: title}));
	var changeCount = state.wiki.getChangeCount(title).toString();
	response.writeHead(204, "OK",{
		Etag: "\"default/" + encodeURIComponent(title) + "/" + changeCount + ":\"",
		"Content-Type": "text/plain"
	});
	response.end();
};
