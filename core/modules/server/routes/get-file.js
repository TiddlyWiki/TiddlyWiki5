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
	if(path.relative(basePath,fullPath).indexOf("..") !== 0) {
		// Check if file exists first
		fs.stat(fullPath, function(err, stats) {
			if(err) {
				console.log("Error accessing file " + fullPath + ": " + err.toString());
				return state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + filename + "' not found");
			} else {
				var type = ($tw.config.fileExtensionInfo[extension] ? $tw.config.fileExtensionInfo[extension].type : "application/octet-stream");
				response.writeHead(200, {
					"Content-Type": type,
					"Content-Length": stats.size
				});
				var stream = fs.createReadStream(fullPath);
				stream.on("error", function(err) {
					console.log("Error reading file " + fullPath + ": " + err.toString());
					if(!response.headersSent) {
						return state.sendResponse(500,{"Content-Type": "text/plain"},"Read error");
					}
				});
				stream.pipe(response);
			}
		});
	} else {
		return state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + filename + "' not found");
	}
};
