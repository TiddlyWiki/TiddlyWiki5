/*
FileRetriever can asynchronously retrieve files from HTTP URLs or the local file system. It incorporates
throttling so that we don't get error EMFILE "Too many open files".
*/

var fs = require("fs"),
	path = require("path"),
	utils = require("./Utils.js");

var FileRetriever = exports;

var fileRequestQueue = utils.queue(function(task,callback) {
	fs.readFile(task.filepath,"utf8", function(err,data) {
		callback(err,data);
	});
},10);

// Retrieve a file given a filepath specifier and a context path. If the filepath isn't an absolute
// filepath or an absolute URL, then it is interpreted relative to the context path, which can also be
// a filepath or a URL. It returns the final path used to reach the file. On completion, the callback
// function is called as callback(err,data)
FileRetriever.retrieveFile = function(filepath,contextPath,callback) {
	var newpath = path.resolve(path.dirname(contextPath),filepath);
	fileRequestQueue.push({filepath: newpath},callback);
	return newpath;
}
