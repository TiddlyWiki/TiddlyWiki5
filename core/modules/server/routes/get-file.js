/*\
title: $:/core/modules/server/routes/get-file.js
type: application/javascript
module-type: route

GET /files/:filepath

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/files\/(.+)$/;

exports.handler = function(request,response,state) {
	var path = require("path"),
		fs = require("fs"),
		util = require("util");
	var filename = path.resolve($tw.boot.wikiPath,"files",decodeURIComponent(state.params[0])),
		extension = path.extname(filename);
	fs.readFile(filename,function(err,content) {
		var status,content,type = "text/plain";
		if(err) {
			if(err.code === "ENOENT") {
				status = 404;
				content = "File '" + filename + "' not found";
			} else if(err.code === "EACCES") {
				status = 403;
				content = "You do not have permission to access the file '" + filename + "'";
			} else {
				status = 500;
				content = err.toString();
			}
		} else {
			status = 200;
			content = content;
			type = ($tw.config.fileExtensionInfo[extension] ? $tw.config.fileExtensionInfo[extension].type : "application/octet-stream");
		}
		response.writeHead(status,{
			"Content-Type": type
		});
		response.end(content);
	});
};

}());
