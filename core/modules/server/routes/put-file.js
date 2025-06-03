/*\
title: $:/core/modules/server/routes/put-file.js
type: application/javascript
module-type: route

PUT /files/:filepath

\*/
"use strict";

exports.method = "PUT";

exports.path = /^\/files\/(.+)$/;

exports.bodyFormat = "buffer";

exports.handler = function(request,response,state) {
	var path = require("path"),fs = require("fs"),
		filename = $tw.utils.decodeURIComponentSafe(state.params[0]),
		basePath = path.resolve(state.boot.wikiPath,"files"),
		fullPath = path.resolve(basePath,filename);
	if(path.relative(basePath,fullPath).indexOf("..") === 0) {
		state.sendResponse(403,{"Content-Type": "text/plain"},"Access denied");
	} else {
		fs.mkdir(path.dirname(fullPath), {recursive:true}, function(err) {
			if(err && err.code !== 'EEXIST') return state.sendResponse(500,{"Content-Type": "text/plain"},"Directory error");
			fs.writeFile(fullPath, state.data, function(err) {
				state.sendResponse(err ? 500 : 204,{"Content-Type": "text/plain"}, err ? "Write error" : "");
			});
		});
	}
};
