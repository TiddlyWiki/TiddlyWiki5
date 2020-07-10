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
Return the subdirectories of a path
*/
exports.getSubdirectories = function(dirPath) {
	if(!$tw.utils.isDirectory(dirPath)) {
		return null;
	}
	var subdirs = [];
	$tw.utils.each(fs.readdirSync(dirPath),function(item) {
		if($tw.utils.isDirectory(path.resolve(dirPath,item))) {
			subdirs.push(item);
		}
	});
	return subdirs;
}

/*
Recursively (and synchronously) copy a directory and all its content
*/
exports.copyDirectory = function(srcPath,dstPath) {
	// Remove any trailing path separators
	srcPath = path.resolve($tw.utils.removeTrailingSeparator(srcPath));
	dstPath = path.resolve($tw.utils.removeTrailingSeparator(dstPath));
	// Check that neither director is within the other
	if(srcPath.substring(0,dstPath.length) === dstPath || dstPath.substring(0,srcPath.length) === srcPath) {
		return "Cannot copy nested directories";
	}
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
			}
		}
	};
	copy(srcPath,dstPath);
	return null;
};

/*
Copy a file
*/
var FILE_BUFFER_LENGTH = 64 * 1024,
	fileBuffer;

exports.copyFile = function(srcPath,dstPath) {
	// Create buffer if required
	if(!fileBuffer) {
		fileBuffer = Buffer.alloc(FILE_BUFFER_LENGTH);
	}
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
};

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
	if(dirPath.substr(dirPath.length-1,1) !== path.sep) {
		dirPath = dirPath + path.sep;
	}
	var pos = 1;
	pos = dirPath.indexOf(path.sep,pos);
	while(pos !== -1) {
		var subDirPath = dirPath.substr(0,pos);
		if(!$tw.utils.isDirectory(subDirPath)) {
			try {
				fs.mkdirSync(subDirPath);
			} catch(e) {
				return "Error creating directory '" + subDirPath + "'";
			}
		}
		pos = dirPath.indexOf(path.sep,pos + 1);
	}
	return null;
};

/*
Recursively create directories needed to contain a specified file
*/
exports.createFileDirectories = function(filePath) {
	return $tw.utils.createDirectory(path.dirname(filePath));
};

/*
Recursively delete a directory
*/
exports.deleteDirectory = function(dirPath) {
	if(fs.existsSync(dirPath)) {
		var entries = fs.readdirSync(dirPath);
		for(var entryIndex=0; entryIndex<entries.length; entryIndex++) {
			var currPath = dirPath + path.sep + entries[entryIndex];
			if(fs.lstatSync(currPath).isDirectory()) {
				$tw.utils.deleteDirectory(currPath);
			} else {
				fs.unlinkSync(currPath);
			}
		}
	fs.rmdirSync(dirPath);
	}
	return null;
};

/*
Check if a path identifies a directory
*/
exports.isDirectory = function(dirPath) {
	return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
};

/*
Check if a path identifies a directory that is empty
*/
exports.isDirectoryEmpty = function(dirPath) {
	if(!$tw.utils.isDirectory(dirPath)) {
		return false;
	}
	var files = fs.readdirSync(dirPath),
		empty = true;
	$tw.utils.each(files,function(file,index) {
		if(file.charAt(0) !== ".") {
			empty = false;
		}
	});
	return empty;
};

/*
Recursively delete a tree of empty directories
*/
exports.deleteEmptyDirs = function(dirpath,callback) {
	var self = this;
	fs.readdir(dirpath,function(err,files) {
		if(err) {
			return callback(err);
		}
		if(files.length > 0) {
			return callback(null);
		}
		fs.rmdir(dirpath,function(err) {
			if(err) {
				return callback(err);
			}
			self.deleteEmptyDirs(path.dirname(dirpath),callback);
		});
	});
};

/*
Create a fileInfo object for saving a tiddler:
	filepath: the absolute path to the file containing the tiddler
	type: the type of the tiddler file (NOT the type of the tiddler)
	hasMetaFile: true if the file also has a companion .meta file
Options include:
	directory: absolute path of root directory to which we are saving
	pathFilters: optional array of filters to be used to generate the base path
	wiki: optional wiki for evaluating the pathFilters
*/
exports.generateTiddlerFileInfo = function(tiddler,options) {
	var fileInfo = {};
	// Check if the tiddler has any unsafe fields that can't be expressed in a .tid or .meta file: containing control characters, or leading/trailing whitespace
	var hasUnsafeFields = false;
	$tw.utils.each(tiddler.getFieldStrings(),function(value,fieldName) {
		if(fieldName !== "text") {
			hasUnsafeFields = hasUnsafeFields || /[\x00-\x1F]/mg.test(value);
			hasUnsafeFields = hasUnsafeFields || ($tw.utils.trim(value) !== value);
		}
	});
	// Check for field values 
	if(hasUnsafeFields) {
		// Save as a JSON file
		fileInfo.type = "application/json";
		fileInfo.hasMetaFile = false;
	} else {
		// Save as a .tid or a text/binary file plus a .meta file
		var tiddlerType = tiddler.fields.type || "text/vnd.tiddlywiki";
		if(tiddlerType === "text/vnd.tiddlywiki") {
			// Save as a .tid file
			fileInfo.type = "application/x-tiddler";
			fileInfo.hasMetaFile = false;
		} else {
			// Save as a text/binary file and a .meta file
			fileInfo.type = tiddlerType;
			fileInfo.hasMetaFile = true;
		}
	}
	// Take the file extension from the tiddler content type
	var contentTypeInfo = $tw.config.contentTypeInfo[fileInfo.type] || {extension: ""};
	// Generate the filepath
	fileInfo.filepath = $tw.utils.generateTiddlerFilepath(tiddler.fields.title,{
		extension: contentTypeInfo.extension,
		directory: options.directory,
		pathFilters: options.pathFilters,
		wiki: options.wiki
	});
	return fileInfo;
};

/*
Generate the filepath for saving a tiddler
Options include:
	extension: file extension to be added the finished filepath
	directory: absolute path of root directory to which we are saving
	pathFilters: optional array of filters to be used to generate the base path
	wiki: optional wiki for evaluating the pathFilters
*/
exports.generateTiddlerFilepath = function(title,options) {
	var self = this,
		directory = options.directory || "",
		extension = options.extension || "",
		filepath;
	// Check if any of the pathFilters applies
	if(options.pathFilters && options.wiki) {
		$tw.utils.each(options.pathFilters,function(filter) {
			if(!filepath) {
				var source = options.wiki.makeTiddlerIterator([title]),
					result = options.wiki.filterTiddlers(filter,null,source);
				if(result.length > 0) {
					filepath = result[0];
				}
			}
		});
	}
	// If not, generate a base pathname
	if(!filepath) {
		filepath = title;
		// If the filepath already ends in the extension then remove it
		if(filepath.substring(filepath.length - extension.length) === extension) {
			filepath = filepath.substring(0,filepath.length - extension.length);
		}
		// Remove any forward or backward slashes so we don't create directories
		filepath = filepath.replace(/\/|\\/g,"_");
	}
	// Don't let the filename start with a dot because such files are invisible on *nix
	filepath = filepath.replace(/^\./g,"_");
	// Remove any characters that can't be used in cross-platform filenames
	filepath = $tw.utils.transliterate(filepath.replace(/<|>|\:|\"|\||\?|\*|\^/g,"_"));
	// Truncate the filename if it is too long
	if(filepath.length > 200) {
		filepath = filepath.substr(0,200);
	}
	// If the resulting filename is blank (eg because the title is just punctuation characters)
	if(!filepath) {
		// ...then just use the character codes of the title
		filepath = "";	
		$tw.utils.each(title.split(""),function(char) {
			if(filepath) {
				filepath += "-";
			}
			filepath += char.charCodeAt(0).toString();
		});
	}
	// Add a uniquifier if the file already exists
	var fullPath,
		count = 0;
	do {
		fullPath = path.resolve(directory,filepath + (count ? "_" + count : "") + extension);
		count++;
	} while(fs.existsSync(fullPath));
	// Return the full path to the file
	return fullPath;
};

/*
Save a tiddler to a file described by the fileInfo:
	filepath: the absolute path to the file containing the tiddler
	type: the type of the tiddler file (NOT the type of the tiddler)
	hasMetaFile: true if the file also has a companion .meta file
*/
exports.saveTiddlerToFile = function(tiddler,fileInfo,callback) {
	$tw.utils.createDirectory(path.dirname(fileInfo.filepath));
	if(fileInfo.hasMetaFile) {
		// Save the tiddler as a separate body and meta file
		var typeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/plain"] || {encoding: "utf8"};
		fs.writeFile(fileInfo.filepath,tiddler.fields.text,typeInfo.encoding,function(err) {
			if(err) {
				return callback(err);
			}
			fs.writeFile(fileInfo.filepath + ".meta",tiddler.getFieldStringBlock({exclude: ["text","bag"]}),"utf8",callback);
		});
	} else {
		// Save the tiddler as a self contained templated file
		if(fileInfo.type === "application/x-tiddler") {
			fs.writeFile(fileInfo.filepath,tiddler.getFieldStringBlock({exclude: ["text","bag"]}) + (!!tiddler.fields.text ? "\n\n" + tiddler.fields.text : ""),"utf8",callback);
		} else {
			fs.writeFile(fileInfo.filepath,JSON.stringify([tiddler.getFieldStrings({exclude: ["bag"]})],null,$tw.config.preferences.jsonSpaces),"utf8",callback);
		}
	}
};

/*
Save a tiddler to a file described by the fileInfo:
	filepath: the absolute path to the file containing the tiddler
	type: the type of the tiddler file (NOT the type of the tiddler)
	hasMetaFile: true if the file also has a companion .meta file
*/
exports.saveTiddlerToFileSync = function(tiddler,fileInfo) {
	$tw.utils.createDirectory(path.dirname(fileInfo.filepath));
	if(fileInfo.hasMetaFile) {
		// Save the tiddler as a separate body and meta file
		var typeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/plain"] || {encoding: "utf8"};
		fs.writeFileSync(fileInfo.filepath,tiddler.fields.text,typeInfo.encoding);
		fs.writeFileSync(fileInfo.filepath + ".meta",tiddler.getFieldStringBlock({exclude: ["text","bag"]}),"utf8");
	} else {
		// Save the tiddler as a self contained templated file
		if(fileInfo.type === "application/x-tiddler") {
			fs.writeFileSync(fileInfo.filepath,tiddler.getFieldStringBlock({exclude: ["text","bag"]}) + (!!tiddler.fields.text ? "\n\n" + tiddler.fields.text : ""),"utf8");
		} else {
			fs.writeFileSync(fileInfo.filepath,JSON.stringify([tiddler.getFieldStrings({exclude: ["bag"]})],null,$tw.config.preferences.jsonSpaces),"utf8");
		}
	}
};

})();
