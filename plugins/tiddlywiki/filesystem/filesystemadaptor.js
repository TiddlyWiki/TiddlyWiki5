/*\
title: $:/plugins/tiddlywiki/filesystem/filesystemadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the local filesystem via node.js APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get a reference to the file system
var fs = $tw.node ? require("fs") : null,
	path = $tw.node ? require("path") : null;

function FileSystemAdaptor(options) {
	var self = this;
	this.wiki = options.wiki;
	this.logger = new $tw.utils.Logger("FileSystem");
	// Create the <wiki>/tiddlers folder if it doesn't exist
	$tw.utils.createDirectory($tw.boot.wikiTiddlersPath);
}

FileSystemAdaptor.prototype.isReady = function() {
	// The file system adaptor is always ready
	return true;
};

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {};
};

$tw.config.typeInfo = {
	"text/vnd.tiddlywiki": {
		fileType: "application/x-tiddler",
		extension: ".tid"
	}
};

FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// See if we've already got information about this file
	var self = this,
		title = tiddler.fields.title,
		fileInfo = $tw.boot.files[title];
	// Get information about how to save tiddlers of this type
	var type = tiddler.fields.type || "text/vnd.tiddlywiki";
	var typeInfo = $tw.config.typeInfo[type] ||
		$tw.config.contentTypeInfo[type] ||
		$tw.config.typeInfo["text/vnd.tiddlywiki"];
	var extension = typeInfo.extension || "";
	if(!fileInfo) {
		// If not, we'll need to generate it
		// Start by getting a list of the existing files in the directory
		fs.readdir($tw.boot.wikiTiddlersPath,function(err,files) {
			if(err) {
				return callback(err);
			}
			// Assemble the new fileInfo
			fileInfo = {};
			fileInfo.filepath = $tw.boot.wikiTiddlersPath + path.sep + self.generateTiddlerFilename(title,extension,files);
			fileInfo.type = typeInfo.fileType || tiddler.fields.type;
			fileInfo.hasMetaFile = typeInfo.hasMetaFile;
			// Save the newly created fileInfo
			$tw.boot.files[title] = fileInfo;
			// Pass it to the callback
			callback(null,fileInfo);
		});
	} else {
		// Otherwise just invoke the callback
		callback(null,fileInfo);
	}
};

/*
Transliterate string from cyrillic russian to latin
*/
 var transliterate = function(cyrillyc) {
	var a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"};
	return cyrillyc.split("").map(function (char) {
		return a[char] || char;
	}).join("");
};

/*
Given a list of filters, apply every one in turn to source, and return the first result of the first filter with non-empty result.
*/
FileSystemAdaptor.prototype.findFirstFilter = function(filters,source) {
	var numFilters = filters.length;
	for(var i=0; i<numFilters; i++) {
		var result = this.wiki.filterTiddlers(filters[i],null,source);
		if(result.length > 0) {
			return result[0];
		}
	}
};

/*
Add file extension to a file path if it doesn't already exist.
*/
FileSystemAdaptor.addFileExtension = function(file,extension) {
	return $tw.utils.strEndsWith(file,extension) ? file : file + extension;
};


/*
Given a tiddler title and an array of existing filenames, generate a new legal filename for the title, case insensitively avoiding the array of existing filenames
*/
FileSystemAdaptor.prototype.generateTiddlerFilename = function(title,extension,existingFilenames) {
	var baseFilename;
	// Check whether the user has configured a tiddler -> pathname mapping
	var pathNameFilters = this.wiki.getTiddlerText("$:/config/FileSystemPaths");
	if(pathNameFilters) {
		var source = this.wiki.makeTiddlerIterator([title]);
		var result = this.findFirstFilter(pathNameFilters.split("\n"),source);
		if(result) {
			// interpret "/" as path separator
			baseFilename = result.replace(/\//g,path.sep);
		}
	}
	if(!baseFilename) {
		// no mapping configured, or it did not match this tiddler
		// in this case, we fall back to legacy behaviour
		baseFilename = title.replace(/\//g,"_");
	}
	// Remove any of the characters that are illegal in Windows filenames
	var baseFilename = transliterate(baseFilename.replace(/<|>|\:|\"|\\|\||\?|\*|\^|\s/g,"_"));
	// Truncate the filename if it is too long
	if(baseFilename.length > 200) {
		baseFilename = baseFilename.substr(0,200);
	}
	// Start with the base filename plus the extension
	var filename = FileSystemAdaptor.addFileExtension(baseFilename,extension),
		count = 1;
	// Add a discriminator if we're clashing with an existing filename while
	// handling case-insensitive filesystems (NTFS, FAT/FAT32, etc.)
	while(existingFilenames.some(function(value) {return value.toLocaleLowerCase() === filename.toLocaleLowerCase();})) {
		filename = baseFilename + " " + (count++) + extension;
	}
	return filename;
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	var self = this;
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		var template, content, encoding, filepath,
			_finish = function() {
				callback(null, {}, 0);
			};
		if(err) {
			return callback(err);
		}
		var error = $tw.utils.createDirectory(path.dirname(fileInfo.filepath));
		if(error) {
			return callback(error);
		}
		var typeInfo = $tw.config.contentTypeInfo[fileInfo.type];
		if(fileInfo.hasMetaFile || typeInfo.encoding === "base64") {
			// Save the tiddler as a separate body and meta file
			filepath = fileInfo.filepath;
			fs.writeFile(filepath,tiddler.fields.text,{encoding: typeInfo.encoding},function(err) {
				if(err) {
					return callback(err);
				}
				content = self.wiki.renderTiddler("text/plain","$:/core/templates/tiddler-metadata",{variables: {currentTiddler: tiddler.fields.title}});
				filepath = FileSystemAdaptor.addFileExtension(fileInfo.filepath,".meta");
				fs.writeFile(filepath,content,{encoding: "utf8"},function (err) {
					if(err) {
						return callback(err);
					}
					self.logger.log("Saved file",filepath);
					_finish();
				});
			});
		} else {
			// Save the tiddler as a self contained templated file
			content = self.wiki.renderTiddler("text/plain","$:/core/templates/tid-tiddler",{variables: {currentTiddler: tiddler.fields.title}});
			filepath = FileSystemAdaptor.addFileExtension(fileInfo.filepath,".tid");
			fs.writeFile(filepath,content,{encoding: "utf8"},function (err) {
				if(err) {
					return callback(err);
				}
				self.logger.log("Saved file",filepath);
				_finish();
			});
		}
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
FileSystemAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this,
		fileInfo = $tw.boot.files[title];
	// Only delete the tiddler if we have writable information for the file
	if(fileInfo) {
		// Delete the file
		fs.unlink(fileInfo.filepath,function(err) {
			if(err) {
				return callback(err);
			}
			self.logger.log("Deleted file",fileInfo.filepath);
			// Delete the metafile if present
			if(fileInfo.hasMetaFile) {
				fs.unlink(FileSystemAdaptor.addFileExtension(fileInfo.filepath,".meta"),function(err) {
					if(err) {
						return callback(err);
					}
					$tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),callback);
				});
			} else {
				$tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),callback);
			}
		});
	} else {
		callback(null);
	}
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
