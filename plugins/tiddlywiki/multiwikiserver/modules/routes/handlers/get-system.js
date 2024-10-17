/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-system.js
type: application/javascript
module-type: mws-route

Retrieves a system file. System files are stored in configuration tiddlers with the following fields:

* title: "$:/plugins/tiddlywiki/multiwikiserver/system-files/" suffixed with the name of the file
* tags: tagged $:/tags/MWS/SystemFile or $:/tags/MWS/SystemFileWikified
* system-file-type: optionally specify the MIME type that should be returned for the file

GET /.system/:filename

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/\.system\/(.+)$/;

const SYSTEM_FILE_TITLE_PREFIX = "$:/plugins/tiddlywiki/multiwikiserver/system-files/";

exports.handler = function(request,response,state) {
	// Get the  parameters
	const filename = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = SYSTEM_FILE_TITLE_PREFIX + filename,
		tiddler = $tw.wiki.getTiddler(title),
		isSystemFile = tiddler && tiddler.hasTag("$:/tags/MWS/SystemFile"),
		isSystemFileWikified = tiddler && tiddler.hasTag("$:/tags/MWS/SystemFileWikified");
	if(tiddler && (isSystemFile || isSystemFileWikified)) {
		let text = tiddler.fields.text || "";
		const type = tiddler.fields["system-file-type"] || tiddler.fields.type || "text/plain",
			encoding = ($tw.config.contentTypeInfo[type] ||{encoding: "utf8"}).encoding;
		if(isSystemFileWikified) {
			text = $tw.wiki.renderTiddler("text/plain",title);
		}
		response.writeHead(200, "OK",{
			"Content-Type": type
		});
		response.write(text,encoding);
		response.end();
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
