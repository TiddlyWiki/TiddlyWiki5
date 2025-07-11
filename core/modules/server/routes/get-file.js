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
	const path = require("path");
	const fs = require("fs");
	const util = require("util");
	const suppliedFilename = $tw.utils.decodeURIComponentSafe(state.params[0]);
	const baseFilename = path.resolve(state.boot.wikiPath,"files");
	const filename = path.resolve(baseFilename,suppliedFilename);
	const extension = path.extname(filename);
	// Check that the filename is inside the wiki files folder
	if(path.relative(baseFilename,filename).indexOf("..") !== 0) {
		// Send the file
		fs.readFile(filename,(err,content) => {
			let status; var content; let type = "text/plain";
			if(err) {
				console.log(`Error accessing file ${filename}: ${err.toString()}`);
				status = 404;
				content = `File '${suppliedFilename}' not found`;
			} else {
				status = 200;
				content = content;
				type = ($tw.config.fileExtensionInfo[extension] ? $tw.config.fileExtensionInfo[extension].type : "application/octet-stream");
			}
			state.sendResponse(status,{"Content-Type": type},content);
		});
	} else {
		state.sendResponse(404,{"Content-Type": "text/plain"},`File '${suppliedFilename}' not found`);
	}
};
