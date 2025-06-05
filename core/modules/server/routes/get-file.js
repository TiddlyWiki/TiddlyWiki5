/*\
title: $:/core/modules/server/routes/get-file.js
type: application/javascript
module-type: route

GET /files/:filepath

\*/
"use strict";

exports.method = "GET";

exports.path = /^\/files\/(.+)$/;

exports.handler = function(request,response,state) {
	var path = require("path"),
		fs = require("fs"),
		filename = $tw.utils.decodeURIComponentSafe(state.params[0]),
		basePath = path.resolve(state.boot.wikiPath,"files"),
		fullPath = path.resolve(basePath,filename),
		extension = path.extname(fullPath);

	// Check that the filename is inside the wiki files folder
	if(path.relative(basePath,fullPath).indexOf("..") === 0) {
		return state.sendResponse(403,{"Content-Type": "text/plain"},"Access denied");
	}
	fs.stat(fullPath, function(err, stats) {
		if(err) {
			state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + filename + "' not found");
			return;
		} else {
			var type = ($tw.config.fileExtensionInfo[extension] ? $tw.config.fileExtensionInfo[extension].type : "application/octet-stream"),
				responseHeaders = {
					"Content-Type": type,
					"Accept-Ranges": "bytes"
				};
			var rangeHeader = request.headers.range,
				stream;
			if(rangeHeader) {
				// Handle range requests
				var parts = rangeHeader.replace(/bytes=/, "").split("-"),
					start = parseInt(parts[0], 10),
					end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1,
					chunksize = (end - start) + 1;
				responseHeaders["Content-Range"] = "bytes " + start + "-" + end + "/" + stats.size;
				responseHeaders["Content-Length"] = chunksize;
				response.writeHead(206, responseHeaders);
				stream = fs.createReadStream(fullPath, {start: start, end: end});
			} else {
				responseHeaders["Content-Length"] = stats.size;
				response.writeHead(200, responseHeaders);
				stream = fs.createReadStream(fullPath);
			}
			// Common stream error handling
			stream.on("error", function(err) {
				if(!response.headersSent) {
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.end("Read error");
				} else {
					response.destroy();
				}
			});
			stream.on("end", function() {
				if(!response.headersSent) {
					response.end();
				}
			});
			stream.pipe(response);
		}
	});
};
