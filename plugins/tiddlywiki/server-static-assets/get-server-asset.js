/*\
title: $:/plugins/tiddlywiki/server-static-assets/get-server-asset.js
type: application/javascript
module-type: serverroute

GET /assets/:server_asset

\*/
/*jshint maxlen:false */
(function() {
	if(!$tw.node) { return; }

	var path = require("path");
	var fs = require("fs");
	var util = require("util");

	var RESPONSES = {
		_ok: function(filename,content) {
			var extension = path.extname(filename);
			return {
				status: 200,
				content: content,
				type: $tw.config.fileExtensionInfo[extension] || "application/octet-stream"
			};
		},
		_error: function(filename,err) {
			return {status: 500, content: err.toString(), type: "text/plain"};
		},
		ENOENT: function(filename) {
			return {
				status: 404,
				content: "File '" + filename + "' not found.",
				type: "text/plain"
			};
		},
		EACCES: function(filename) {
			return {
				status: 403,
				content: "File '" + filename + "' is forbidden (permissions).",
				type: "text/plain"
			};
		}
	};

	module.exports = {
		method: "GET",
		path: /^\/assets\/(.+)$/,

		handler: function(request,response,state) {
			var filename = path.join($tw.boot.wikiPath, "assets", state.params[0]);
			var extension = path.extname(filename);
			fs.readFile(filename,function(err,content) {
				var contentInfo = err ? RESPONSES[err.code] || RESPONSES._error : RESPONSES._ok;
				var responseData = contentInfo(filename, err || content);
				response.writeHead(responseData.status, {"Content-Type": responseData.type});
				response.end(responseData.content);
			});
		}
	};
}());
