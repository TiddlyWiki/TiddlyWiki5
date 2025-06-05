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

	if(path.relative(basePath,fullPath).indexOf("..") === 0) {
		return state.sendResponse(403,{"Content-Type": "text/plain"},"Access denied");
	}
	fs.stat(fullPath, function(err, stats) {
		if(err) {
			$tw.utils.error("Error accessing file " + fullPath + ": " + err.toString());
			return state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + filename + "' not found");
		}
		var type = ($tw.config.fileExtensionInfo[extension] ? $tw.config.fileExtensionInfo[extension].type : "application/octet-stream");
		var responseHeaders = {
			"Content-Type": type,
			"Accept-Ranges": "bytes" 
		};
		// Handle range requests
		var rangeHeader = request.headers.range;
		if(rangeHeader) {
			var parts = rangeHeader.replace(/bytes=/, "").split("-"),
				start = parseInt(parts[0], 10),
				end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1,
				chunksize = (end - start) + 1;

			responseHeaders["Content-Range"] = `bytes ${start}-${end}/${stats.size}`;
			responseHeaders["Content-Length"] = chunksize;
			response.writeHead(206, responseHeaders);
			var stream = fs.createReadStream(fullPath, {start, end});
			stream.on("error", function(err) {
				$tw.utils.error("Error reading file " + fullPath + ": " + err.toString());
				if(!response.headersSent) {
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.end("Read error");
				}
			});
			stream.pipe(response);
		} else {
			// Handle regular requests
			responseHeaders["Content-Length"] = stats.size;
			response.writeHead(200, responseHeaders);
			var stream = fs.createReadStream(fullPath);
			stream.on("error", function(err) {
				$tw.utils.error("Error reading file " + fullPath + ": " + err.toString());
				if(!response.headersSent) {
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.end("Read error");
				}
			});
			stream.pipe(response);
		}
	});
};
