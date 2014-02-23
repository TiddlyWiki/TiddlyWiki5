/*\
title: $:/core/modules/utils/filesystem.js
type: application/javascript
module-type: utils-node

File system utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fs = require("fs"),
	path = require("path");

/*
Recursively (and synchronously) copy a directory and all its content
*/
exports.copyDirectory = function(srcPath,dstPath) {
	// Remove any trailing path separators
	srcPath = $tw.utils.removeTrailingSeparator(srcPath);
	dstPath = $tw.utils.removeTrailingSeparator(dstPath);
	// Create the destination directory
	var err = $tw.utils.createDirectory(dstPath);
	if(err) {
		return err;
	}
	// Function to copy a folder full of files
	var copy = function(srcPath,dstPath) {
		var srcStats = fs.lstatSync(srcPath),
			dstExists = fs.existsSync(dstPath);
		if(srcStats.isFile()) {
			$tw.utils.copyFile(srcPath,dstPath);
		} else if(srcStats.isDirectory()) {
			var items = fs.readdirSync(srcPath);
			for(var t=0; t<items.length; t++) {
				var item = items[t],
					err = copy(srcPath + path.sep + item,dstPath + path.sep + item);
				if(err) {
					return err;
				}
			};
		}
	};
	copy(srcPath,dstPath);
	return null;
};

/*
Copy a file
*/
var FILE_BUFFER_LENGTH = 64 * 1024,
	fileBuffer = $tw.node && new Buffer(FILE_BUFFER_LENGTH);

exports.copyFile = function(srcPath,dstPath) {
	// Create any directories in the destination
	$tw.utils.createDirectory(path.dirname(dstPath));
	// Copy the file
	var srcFile = fs.openSync(srcPath,"r"),
		dstFile = fs.openSync(dstPath,"w"),
		bytesRead = 1,
		pos = 0;
	while (bytesRead > 0) {
		bytesRead = fs.readSync(srcFile,fileBuffer,0,FILE_BUFFER_LENGTH,pos);
		fs.writeSync(dstFile,fileBuffer,0,bytesRead);
		pos += bytesRead;
	}
	fs.closeSync(srcFile);
	fs.closeSync(dstFile);
	return null;
}

/*
Remove trailing path separator
*/
exports.removeTrailingSeparator = function(dirPath) {
	var len = dirPath.length;
	if(dirPath.charAt(len-1) === path.sep) {
		dirPath = dirPath.substr(0,len-1);
	}
	return dirPath;
};

/*
Recursively create a directory
*/
exports.createDirectory = function(dirPath) {
	var parts = dirPath.split(path.sep);
	for(var component=0; component<parts.length; component++) {
		var subDirPath = parts.slice(0,component+1).join(path.sep);
		if(!$tw.utils.isDirectory(subDirPath)) {
			try {
				fs.mkdirSync(subDirPath);
			} catch(e) {
				return "Error creating directory '" + subDirPath + "'";
			}
		}
	}
	return null;
};

/*
Check if a path identifies a directory
*/
exports.isDirectory = function(dirPath) {
	return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
};

})();
