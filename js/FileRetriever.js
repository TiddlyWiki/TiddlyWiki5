/*\
title: js/FileRetriever.js

FileRetriever can asynchronously retrieve files from HTTP URLs or the local file system

\*/
(function(){

/*jslint node: true */
"use strict";

var fs = require("fs"),
	path = require("path"),
	url = require("url"),
	util = require("util"),
	http = require("http"),
	https = require("https");

var FileRetriever = exports;

var fileRequest = function fileRequest(filepath,callback) {
	fs.readFile(filepath, function (err,data) {
		if(err) {
			callback(err); 
		} else {
			if([".jpg",".jpeg",".png"].indexOf(path.extname(filepath)) !== -1) {
				callback(err,data.toString("base64"));
			} else {
				callback(err,data.toString("utf8"));
			}
		}
	});
};

var httpRequest = function(fileurl,callback) {
	var opts = url.parse(fileurl);
	var httpLib = opts.protocol === "http:" ? http : https;
	var request = httpLib.get(opts,function(res) {
		if(res.statusCode != 200) {
			var err = new Error("HTTP error");
			err.code = res.statusCode.toString();
			callback(err);
		} else {
			var data = [];
			res.on("data", function(chunk) {
				data.push(chunk);
			});
			res.on("end", function() {
				callback(null,data.join(""));
			});
		}
	});
	request.addListener("error", function(err) {
		callback(err);
	});
	request.end();
};

// Retrieve a file given a filepath specifier and a context path. If the filepath isn't an absolute
// filepath or an absolute URL, then it is interpreted relative to the context path, which can also be
// a filepath or a URL. On completion, the callback function is called as callback(err,data). The
// data hashmap is as follows:
//		text: full text of file
//		path: full path used to reach the file
//		basename: the basename of the file
//		extname: the extension of the file
FileRetriever.retrieveFile = function(filepath,contextPath,callback) {
	var httpRegExp = /^(https?:\/\/)/gi,
		result = {},
		filepathIsHttp = httpRegExp.test(filepath),
		contextPathIsHttp = httpRegExp.test(contextPath),
		requester;
	if(contextPathIsHttp || filepathIsHttp) {
		// If we've got a full HTTP URI then we're good to go
		result.path = url.resolve(contextPath,filepath);
		var parsedPath = url.parse(result.path);
		result.extname = path.extname(parsedPath.pathname);
		result.basename = path.basename(parsedPath.extname);
		requester = httpRequest;
	} else {
		// It's a file requested in a file context
		result.path = path.resolve(path.dirname(contextPath),filepath);
		result.extname = path.extname(result.path);
		result.basename = path.basename(result.path,result.extname);
		requester = fileRequest;
	}
	requester(result.path,function(err,data) {
		if(!err) {
			result.text = data;
		}
		callback(err,result);
	});
};

})();
