/*
FileRetriever can asynchronously retrieve files from HTTP URLs or the local file system. It incorporates
throttling so that we don't get error EMFILE "Too many open files".
*/

var fs = require("fs"),
	path = require("path"),
	url = require("url"),
	util = require("util"),
	http = require("http"),
	https = require("https"),
	utils = require("./Utils.js");

var FileRetriever = exports;

var fileRequestQueue = utils.queue(function(task,callback) {
	fs.readFile(task.filepath,"utf8", function(err,data) {
		callback(err,data);
console.error("Retrieved " + task.filepath);
	});
},10);

var httpRequestQueue = utils.queue(function(task,callback) {
	var opts = url.parse(task.url);
	var httpLib = opts.protocol === "http:" ? http : https;
	var request = httpLib.get(opts,function(res) {
		if(res.statusCode != 200) {
			var err = new Error("HTTP error");
			err.code = res.statusCode.toString();
			callback(err);
		} else {
			var data = [];
			res.on("data", function(chunk) {
				data.push(chunk)
			});
			res.on("end", function() {
				callback(null,data.join(""));
console.error("Retrieved " + task.url);
			});
		}
	});
	request.addListener("error", function(err) {
	    callback(err);
	});
	request.end();
},4);

// Retrieve a file given a filepath specifier and a context path. If the filepath isn't an absolute
// filepath or an absolute URL, then it is interpreted relative to the context path, which can also be
// a filepath or a URL. It returns the final path used to reach the file. On completion, the callback
// function is called as callback(err,data)
FileRetriever.retrieveFile = function(filepath,contextPath,callback) {
	var httpRegExp = /^(https?:\/\/)/gi,
		newpath,
		filepathIsHttp = httpRegExp.test(filepath),
		contextPathIsHttp = httpRegExp.test(contextPath);
	if(contextPathIsHttp || filepathIsHttp) {
		// If we've got a full HTTP URI then we're good to go
		newpath = url.resolve(contextPath,filepath);
		httpRequestQueue.push({url: newpath},callback);
		return newpath;
	} else {
		// It's a file requested in a file context
		newpath = path.resolve(path.dirname(contextPath),filepath);
		fileRequestQueue.push({filepath: newpath},callback);
		return newpath;
	}
}
