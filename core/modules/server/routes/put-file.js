/*\
title: $:/core/modules/server/routes/put-file.js
type: application/javascript
module-type: route

PUT /files/:filepath

\*/
"use strict";

exports.method = "PUT";

exports.path = /^\/files\/(.+)$/;

exports.handler = function(request,response,state) {
	var path = require("path"),
		fs = require("fs"),
		suppliedFilename = $tw.utils.decodeURIComponentSafe(state.params[0]),
		baseFilename = path.resolve(state.boot.wikiPath,"files"),
		filename = path.resolve(baseFilename,suppliedFilename),
		dirname = path.dirname(filename);
	
	// Check no trying to write to parent folders
	if(path.relative(baseFilename,filename).indexOf("..") === 0) {
		state.sendResponse(403,{"Content-Type": "text/plain"},"Access denied: File '" + suppliedFilename + "' is outside the allowed directory");
	} else {
		// Ensure the directory exists
		fs.mkdir(dirname, { recursive: true }, function(mkdirErr) {
			if(mkdirErr && mkdirErr.code !== 'EEXIST') {
				console.log("Error creating directory " + dirname + ": " + mkdirErr.toString());
				state.sendResponse(500,{"Content-Type": "text/plain"},"Error creating directory");
				return;
			}
			
			// Write the file
			fs.writeFile(filename, state.data, function(err) {
				if(err) {
					console.log("Error writing file " + filename + ": " + err.toString());
					state.sendResponse(500,{"Content-Type": "text/plain"},"Error writing file '" + suppliedFilename + "'");
				} else {
					console.log("File written: " + filename);
					state.sendResponse(204,{"Content-Type": "text/plain"},"");
				}
			});
		});
	}
};
