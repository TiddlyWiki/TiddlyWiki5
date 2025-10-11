/*\
title: $:/core/modules/server/routes/get-file.js
type: application/javascript
module-type: route

GET /files/:filepath

\*/
"use strict";

exports.methods = ["GET"];

exports.path = /^\/files\/(.+)$/;

exports.info = {
	priority: 100
};

exports.handler = function(request,response,state) {
	var path = require("path"),
		fs = require("fs"),
		suppliedFilename = $tw.utils.decodeURIComponentSafe(state.params[0]),
		baseFilename = path.resolve(state.boot.wikiPath,"files"),
		filename = path.resolve(baseFilename,suppliedFilename),
		extension = path.extname(filename);
	// Check that the filename is inside the wiki files folder
	if(path.relative(baseFilename,filename).indexOf("..") === 0) {
		return state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + suppliedFilename + "' not found");
	}
	fs.stat(filename, function(err, stats) {
		if(err) {
			return state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + suppliedFilename + "' not found");
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
					end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
				// Validate start and end
				if(isNaN(start) || isNaN(end) || start < 0 || end < start || end >= stats.size) {
					responseHeaders["Content-Range"] = "bytes */" + stats.size;
					return response.writeHead(416, responseHeaders).end();
				}
				var chunksize = (end - start) + 1;
				responseHeaders["Content-Range"] = "bytes " + start + "-" + end + "/" + stats.size;
				responseHeaders["Content-Length"] = chunksize;
				response.writeHead(206, responseHeaders);
				stream = fs.createReadStream(filename, {start: start, end: end});
			} else {
				responseHeaders["Content-Length"] = stats.size;
				response.writeHead(200, responseHeaders);
				stream = fs.createReadStream(filename);
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
			stream.pipe(response);
		}
	});
};
