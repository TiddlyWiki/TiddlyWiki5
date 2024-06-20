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
	type: the type of the tiddler file on disk (NOT the type of the tiddler)
	hasMetaFile: true if the file also has a companion .meta file
	isEditableFile: true if the tiddler was loaded via non-standard options & marked editable
Options include:
	directory: absolute path of root directory to which we are saving
	pathFilters: optional array of filters to be used to generate the base path
	extFilters: optional array of filters to be used to generate the base path
	wiki: optional wiki for evaluating the pathFilters,
	fileInfo: an existing fileInfo to check against
*/
exports.generateTiddlerFileInfo = function(tiddler,options) {
	var fileInfo = {}, metaExt;
	// Propagate the isEditableFile flag
	if(options.fileInfo && !!options.fileInfo.isEditableFile) {
		fileInfo.isEditableFile = true;
		fileInfo.originalpath = options.fileInfo.originalpath;
	}
	// Check if the tiddler has any unsafe fields that can't be expressed in a .tid or .meta file: containing control characters, or leading/trailing whitespace
	var hasUnsafeFields = false;
	$tw.utils.each(tiddler.getFieldStrings(),function(value,fieldName) {
		if(fieldName !== "text") {
			hasUnsafeFields = hasUnsafeFields || /[\x00-\x1F]/mg.test(value);
			hasUnsafeFields = hasUnsafeFields || ($tw.utils.trim(value) !== value);
		}
		hasUnsafeFields = hasUnsafeFields || /:|#/mg.test(fieldName);
	});
	// Check for field values 
	if(hasUnsafeFields) {
		// Save as a JSON file
		fileInfo.type = "application/json";
		fileInfo.hasMetaFile = false;
	} else {
		// Save as a .tid or a text/binary file plus a .meta file
		var tiddlerType = tiddler.fields.type || "text/vnd.tiddlywiki";
		if(tiddlerType === "text/vnd.tiddlywiki" || tiddler.hasField("_canonical_uri")) {
			// Save as a .tid file
			fileInfo.type = "application/x-tiddler";
			fileInfo.hasMetaFile = false;
		} else {
			// Save as a text/binary file and a .meta file
			fileInfo.type = tiddlerType;
			fileInfo.hasMetaFile = true;
		}
		if(options.extFilters) {
			// Check for extension overrides
			metaExt = $tw.utils.generateTiddlerExtension(tiddler.fields.title,{
				extFilters: options.extFilters,
				wiki: options.wiki
			});
			if(metaExt) {
				if(metaExt === ".tid") {
					// Overriding to the .tid extension needs special handling
					fileInfo.type = "application/x-tiddler";
					fileInfo.hasMetaFile = false;
				} else if (metaExt === ".json") {
					// Overriding to the .json extension needs special handling
					fileInfo.type = "application/json";
					fileInfo.hasMetaFile = false;
				} else {
					//If the new type matches a known extention, use that MIME type's encoding
					var extInfo = $tw.utils.getFileExtensionInfo(metaExt);
					fileInfo.type = extInfo ? extInfo.type : null;
					fileInfo.encoding = $tw.utils.getTypeEncoding(metaExt);
					fileInfo.hasMetaFile = true;
				}
			}
		}
	}
	// Take the file extension from the tiddler content type or metaExt
	var contentTypeInfo = $tw.config.contentTypeInfo[fileInfo.type] || {extension: ""};
	// Generate the filepath
	fileInfo.filepath = $tw.utils.generateTiddlerFilepath(tiddler.fields.title,{
		extension: metaExt || contentTypeInfo.extension,
		directory: options.directory,
		pathFilters: options.pathFilters,
		wiki: options.wiki,
		fileInfo: options.fileInfo
	});
	return fileInfo;
};

/*
Generate the file extension for saving a tiddler
Options include:
	extFilters: optional array of filters to be used to generate the extention
	wiki: optional wiki for evaluating the extFilters
*/
exports.generateTiddlerExtension = function(title,options) {
	var extension;
	// Check if any of the extFilters applies
	if(options.extFilters && options.wiki) { 
		$tw.utils.each(options.extFilters,function(filter) {
			if(!extension) {
				var source = options.wiki.makeTiddlerIterator([title]),
					result = options.wiki.filterTiddlers(filter,null,source);
				if(result.length > 0) {
					extension = result[0];
				}
			}
		});
	}
	return extension;
};

/*
Generate the filepath for saving a tiddler
Options include:
	extension: file extension to be added the finished filepath
	directory: absolute path of root directory to which we are saving
	pathFilters: optional array of filters to be used to generate the base path
	wiki: optional wiki for evaluating the pathFilters
	fileInfo: an existing fileInfo object to check against
	fileInfo.overwrite: if true, turns off filename clash numbers (defaults to false)
*/
exports.generateTiddlerFilepath = function(title,options) {
	var directory = options.directory || "",
		extension = options.extension || "",
		originalpath = (options.fileInfo && options.fileInfo.originalpath) ? options.fileInfo.originalpath : "",
		overwrite = options.fileInfo && options.fileInfo.overwrite || false,
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
	if(!filepath && !!originalpath) {
		//Use the originalpath without the extension
		var ext = path.extname(originalpath);
		filepath = originalpath.substring(0,originalpath.length - ext.length);
	} else if(!filepath) {
		filepath = title;
		// Remove any forward or backward slashes so we don't create directories
		filepath = filepath.replace(/\/|\\/g,"_");
	}
	// Replace any Windows control codes
	filepath = filepath.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i,"_$1_");
	// Replace any leading spaces with the same number of underscores
	filepath = filepath.replace(/^ +/,function (u) { return u.replace(/ /g, "_")});
	//If the path does not start with "." or ".." && a path seperator, then
	if(!/^\.{1,2}[/\\]/g.test(filepath)) {
		// Don't let the filename start with any dots because such files are invisible on *nix
		filepath = filepath.replace(/^\.+/g,function (u) { return u.replace(/\./g, "_")});
	}
	// Replace any Unicode control codes
	filepath = filepath.replace(/[\x00-\x1f\x80-\x9f]/g,"_");
	// Replace any characters that can't be used in cross-platform filenames
	filepath = $tw.utils.transliterate(filepath.replace(/<|>|~|\:|\"|\||\?|\*|\^/g,"_"));
	// Replace any dots or spaces at the end of the extension with the same number of underscores
	extension = extension.replace(/[\. ]+$/, function (u) { return u.replace(/[\. ]/g, "_")});
	// Truncate the extension if it is too long
	if(extension.length > 32) {
		extension = extension.substr(0,32);
	}
	// If the filepath already ends in the extension then remove it
	if(filepath.substring(filepath.length - extension.length) === extension) {
		filepath = filepath.substring(0,filepath.length - extension.length);
	}
	// Truncate the filename if it is too long
	if(filepath.length > 200) {
		filepath = filepath.substr(0,200);
	}
	// If the resulting filename is blank (eg because the title is just punctuation)
	if(!filepath || /^_+$/g.test(filepath)) {
		// ...then just use the character codes of the title
		filepath = "";
		$tw.utils.each(title.split(""),function(char) {
			if(filepath) {
				filepath += "-";
			}
			filepath += char.charCodeAt(0).toString();
		});
	}
	// Add a uniquifier if the file already exists (default)
	var fullPath = path.resolve(directory, filepath + extension);
	if (!overwrite) {
		var oldPath = (options.fileInfo) ? options.fileInfo.filepath : undefined,
		count = 0;
		do {
			fullPath = path.resolve(directory,filepath + (count ? "_" + count : "") + extension);
			if(oldPath && oldPath == fullPath) break;
			count++;
		} while(fs.existsSync(fullPath));
	}
	// If the last write failed with an error, or if path does not start with:
	//	the resolved options.directory, the resolved wikiPath directory, the wikiTiddlersPath directory, 
	//	or the 'originalpath' directory, then $tw.utils.encodeURIComponentExtended() and resolve to options.directory.
	var writePath = $tw.hooks.invokeHook("th-make-tiddler-path",fullPath,fullPath),
		encode = (options.fileInfo || {writeError: false}).writeError == true;
	if(!encode) {
		encode = !(writePath.indexOf($tw.boot.wikiTiddlersPath) == 0 ||
			writePath.indexOf(path.resolve(directory)) == 0 ||
			writePath.indexOf(path.resolve($tw.boot.wikiPath)) == 0 ||
			writePath.indexOf(path.resolve($tw.boot.wikiTiddlersPath,originalpath)) == 0 );
		}
	if(encode) {
		writePath = path.resolve(directory,$tw.utils.encodeURIComponentExtended(fullPath));
	}
	// Return the full path to the file
	return writePath;
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
		fs.writeFile(fileInfo.filepath,tiddler.fields.text || "",typeInfo.encoding,function(err) {
			if(err) {
				return callback(err);
			}
			fs.writeFile(fileInfo.filepath + ".meta",tiddler.getFieldStringBlock({exclude: ["text","bag"]}),"utf8",function(err) {
				if(err) {
					return callback(err);
				}
				return callback(null,fileInfo);
			});
		});
	} else {
		// Save the tiddler as a self contained templated file
		if(fileInfo.type === "application/x-tiddler") {
			fs.writeFile(fileInfo.filepath,tiddler.getFieldStringBlock({exclude: ["text","bag"]}) + (!!tiddler.fields.text ? "\n\n" + tiddler.fields.text : ""),"utf8",function(err) {
				if(err) {
					return callback(err);
				}
				return callback(null,fileInfo);
			});
		} else {
			fs.writeFile(fileInfo.filepath,JSON.stringify([tiddler.getFieldStrings({exclude: ["bag"]})],null,$tw.config.preferences.jsonSpaces),"utf8",function(err) {
				if(err) {
					return callback(err);
				}
				return callback(null,fileInfo);
			});
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
		fs.writeFileSync(fileInfo.filepath,tiddler.fields.text || "",typeInfo.encoding);
		fs.writeFileSync(fileInfo.filepath + ".meta",tiddler.getFieldStringBlock({exclude: ["text","bag"]}),"utf8");
	} else {
		// Save the tiddler as a self contained templated file
		if(fileInfo.type === "application/x-tiddler") {
			fs.writeFileSync(fileInfo.filepath,tiddler.getFieldStringBlock({exclude: ["text","bag"]}) + (!!tiddler.fields.text ? "\n\n" + tiddler.fields.text : ""),"utf8");
		} else {
			fs.writeFileSync(fileInfo.filepath,JSON.stringify([tiddler.getFieldStrings({exclude: ["bag"]})],null,$tw.config.preferences.jsonSpaces),"utf8");
		}
	}
	return fileInfo;
};

/*
Delete a file described by the fileInfo if it exits
*/
exports.deleteTiddlerFile = function(fileInfo,callback) {
	//Only attempt to delete files that exist on disk
	if(!fileInfo.filepath || !fs.existsSync(fileInfo.filepath)) {
		//For some reason, the tiddler is only in memory or we can't modify the file at this path
		$tw.syncer.displayError("Server deleteTiddlerFile task failed for filepath: "+fileInfo.filepath);
		return callback(null,fileInfo);
	}
	// Delete the file
	fs.unlink(fileInfo.filepath,function(err) {
		if(err) {
			return callback(err);
		}
		// Delete the metafile if present
		if(fileInfo.hasMetaFile && fs.existsSync(fileInfo.filepath + ".meta")) {
			fs.unlink(fileInfo.filepath + ".meta",function(err) {
				if(err) {
					return callback(err);
				}
				return $tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),function(err) {
					if(err) {
						return callback(err);
					}
					return callback(null,fileInfo);
				});
			});
		} else {
			return $tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),function(err) {
				if(err) {
					return callback(err);
				}
				return callback(null,fileInfo);
			});
		}
	});
};

/*
Cleanup old files on disk, by comparing the options values:
	adaptorInfo from $tw.syncer.tiddlerInfo
	bootInfo from $tw.boot.files
*/
exports.cleanupTiddlerFiles = function(options,callback) {
	var adaptorInfo = options.adaptorInfo || {},
	bootInfo = options.bootInfo || {},
	title = options.title || "undefined";
	if(adaptorInfo.filepath && bootInfo.filepath && adaptorInfo.filepath !== bootInfo.filepath) {
		$tw.utils.deleteTiddlerFile(adaptorInfo,function(err) {
			if(err) {
				if ((err.code == "EPERM" || err.code == "EACCES") && err.syscall == "unlink") {
					// Error deleting the previous file on disk, should fail gracefully
					$tw.syncer.displayError("Server desynchronized. Error cleaning up previous file for tiddler: \""+title+"\"",err);
					return callback(null,bootInfo);
				} else {
					return callback(err);
				}
			}
			return callback(null,bootInfo);
		});
	} else {
		return callback(null,bootInfo);
	}
};

})();
