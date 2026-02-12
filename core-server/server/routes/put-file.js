/*\
title: $:/core/modules/server/routes/put-file.js
type: application/javascript
module-type: route

PUT /files/:filepath

\*/
"use strict";

exports.method = "PUT";

exports.path = /^\/files\/(.+)$/;

exports.bodyFormat = "stream";

exports.handler = function(request,response,state) {
	var path = require("path"),
		fs = require("fs"),
		filename = $tw.utils.decodeURIComponentSafe(state.params[0]), 
		basePath = path.resolve(state.boot.wikiPath,"files"),
		fullPath = path.resolve(basePath,filename);
	// Check that the filename is inside the wiki files folder
	if(path.relative(basePath,fullPath).indexOf("..") === 0) {
		return state.sendResponse(404,{"Content-Type": "text/plain"},"File '" + filename + "' not found");
	}
	// Create directory if needed
	fs.mkdir(path.dirname(fullPath),{recursive: true},function(err) {
		if(err && err.code !== "EEXIST") {
			$tw.utils.error("Error creating directory for file " + fullPath + ": " + err.toString());
			return state.sendResponse(500,{"Content-Type": "text/plain"},"Directory error");  
		}
		var stream = fs.createWriteStream(fullPath);
		stream.on("error", function(err) {
			$tw.utils.error("Error writing file " + fullPath + ": " + err.toString());
			if(!response.headersSent) {
				state.sendResponse(500,{"Content-Type": "text/plain"},"Write error");
			}
		});
		stream.on("finish", function() {
			if(!response.headersSent) {
				state.sendResponse(204,{"Content-Type": "text/plain"},"");
			}
		});
		request.on("error", function(err) {
			$tw.utils.error("Error reading request for " + fullPath + ": " + err.toString());
			stream.destroy();
		});
		request.pipe(stream);
	});
};
