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
	var title = $tw.utils.decodeURIComponentSafe(state.params[0]),
	fields = JSON.parse(state.data);
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
	state.wiki.addTiddler(new $tw.Tiddler(state.wiki.getCreationFields(),fields,{title: title},state.wiki.getModificationFields()));
	var changeCount = state.wiki.getChangeCount(title).toString();
	response.writeHead(204, "OK",{
		Etag: "\"default/" + encodeURIComponent(title) + "/" + changeCount + ":\"",
		"Content-Type": "text/plain"
	});
	response.end();
};

}());
