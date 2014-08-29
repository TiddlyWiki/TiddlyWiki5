/*\
title: $:/plugins/tiddlywiki/hierarchicalfilesystem/hierarchicalfilesystemadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the local filesystem via node.js APIs
...in contrast to filesystemadaptor.js this variant understands forward slashes "/"
in tiddler titles and stores tiddlers appropriately in the file system by mapping
the hierarchy in the title to a (sub) directory structure.

In addition, this sync adaptor understands the concept of system tiddlers (starting
their titles with "$:/") and stores them inside a "special" system branch.

Moreover, this sync adaptor also understands the concept of draft tiddlers (based
on the presence of the "draft.of" field) and stores all draft tiddlers in a flat
single ".draft" folder. The makes cleanup and (git) repository syncing easier to do.

The code for this sync adaptor comes from filesystemadaptor.js and has been enhanced
to support hierarchical tiddler storage.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get a reference to the file system
var fs = !$tw.browser ? require("fs") : null,
	path = !$tw.browser ? require("path") : null;

function HierarchicalFileSystemAdaptor(options) {
	var self = this;
	this.wiki = options.wiki;
	this.watchers = {};
	this.pending = {};
	this.logger = new $tw.utils.Logger("HierarchicalFileSystem");
	this.setwatcher = function(filename, title) {
		return undefined;
		return this.watchers[filename] = this.watchers[filename] ||
			fs.watch(filename, {persistent: false}, function(e) {
				self.logger.log("Error:",e,filename);
				if(e === "change") {
					var tiddlers = $tw.loadTiddlersFromFile(filename).tiddlers;
					for(var t in tiddlers) {
						if(tiddlers[t].title) {
							self.wiki.addTiddler(tiddlers[t]);
						}
					}
				}
			});
	}

	for(var f in $tw.boot.files) {
		var fileInfo = $tw.boot.files[f];
		this.setwatcher(fileInfo.filepath, f);
	}
	// Create the <wiki>/tiddlers folder if it doesn't exist
	// TODO: we should create the path recursively
	if(!fs.existsSync($tw.boot.wikiTiddlersPath)) {
		fs.mkdirSync($tw.boot.wikiTiddlersPath);
	}
}

// TODO: may we have modularized plugin config options in the boot kernel?
// The file system folder immediately below the <wiki>/tiddlers root used
// to store system tiddlers that have titles starting with "$:/". Default
// is "system" (please note: no trailing separator slash!).
HierarchicalFileSystemAdaptor.prototype.SYSTEM_FOLDER = "system";
// The draft folder immediately below the <wiki>/tiddlers root used
// to store system tiddlers that have their draft.of field set. Default
// is ".drafts" (please note: no trailing separator slash!).
HierarchicalFileSystemAdaptor.prototype.DRAFT_FOLDER = ".drafts";

HierarchicalFileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {};
};

$tw.config.typeInfo = {
	"text/vnd.tiddlywiki": {
		fileType: "application/x-tiddler",
		extension: ".tid"
	},
	"image/jpeg" : {
		hasMetaFile: true
	}
};

$tw.config.typeTemplates = {
	"application/x-tiddler": "$:/core/templates/tid-tiddler"
};

// mkdirp as in "mkdir -p" ;)
// Ensures that all subdirectories are created along the path, as necessary.
// Fully asynchronous operation. 
HierarchicalFileSystemAdaptor.prototype.mkdirp = function(dir, callback) {
	var mkdirf = function(dir, callback) {
		// head recursion: try to create the directory specified and
		// see what happens. If it exists, then fine and we're done. If
		// it doesn't exist, then go up one directory level in the directory
		// path and recurse down in trying to create the parent directory.
		fs.mkdir(dir, function(err) {
			if(!err || err.code === "EEXIST") {
				// either we succeeded or the directory already existed,
				// so we're done here. We don't see this as an error,
				// it's just fine.
				return callback(null);
			}
			if(err.code !== "ENOENT") {
				// signal all other errors when trying to create the
				// directory directly to the callback. Typically, we
				// will unwind here up to the original caller.
				return callback(err);
			}
			// So we're stuck with ENOENT ... that means that one or more
			// parent directories are still missing. We now need to recurse
			// by going up the directory path elements; but not beyond the
			// beginning.
			var parent = path.dirname(dir);
			if(parent === dir) {
				// when we've hit the root ENOENT then actually is
				// an error and we thus report it back.
				return callback(err);
			}
			mkdirf(parent, function(err) {
				// tail fixup: parent directories should now have been
				// created in case they didn't exist before. But beware
				// of other errors, as usual ... bail out if we couldn't
				// create the required parent directories.
				if(err && err.code !== "EEXIST") {
					return callback(err);
				}
				// Finally: we try to create this particular directory
				// and notify the caller that we're done one way or
				// the other...
				fs.mkdir(dir, function(err) {
					if (err && err.code !== "EEXIST") {
						return callback(err);
					}
					return callback(null);
				});
			});
		});
	};
	// get the whole shebang rolling...
	mkdirf(path.resolve(dir), callback);
};

HierarchicalFileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// See if we've already got information about this file
	var self = this,
		title = tiddler.fields.title,
		fileInfo = $tw.boot.files[title],
		draftOf = tiddler.fields["draft.of"];
	// Get information about how to save tiddlers of this type
	var type = tiddler.fields.type || "text/vnd.tiddlywiki",
		typeInfo = $tw.config.typeInfo[type];
	if(!typeInfo) {
		typeInfo = $tw.config.typeInfo["text/vnd.tiddlywiki"];
	}
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
			fileInfo.filepath = $tw.boot.wikiTiddlersPath + path.sep + self.generateTiddlerFilename(title,draftOf,extension,files);
			fileInfo.type = typeInfo.fileType || tiddler.fields.type;
			fileInfo.hasMetaFile = typeInfo.hasMetaFile;
			// Save the newly created fileInfo
			$tw.boot.files[title] = fileInfo;
			self.pending[fileInfo.filepath] = title;
			// Pass it to the callback
			callback(null,fileInfo);
		});
	} else {
		// Otherwise just invoke the callback
		callback(null,fileInfo);
	}
};

/*
Given a tiddler title and an array of existing filenames, generate a new legal filename for the title, case insensitively avoiding the array of existing filenames
*/
HierarchicalFileSystemAdaptor.prototype.generateTiddlerFilename = function(title,draftOf,extension,existingFilenames) {
	// First remove any of the characters that are illegal in Windows filenames
	//var baseFilename = title.replace(/\<|\>|\:|\"|\/|\\|\||\?|\*|\^/g,"_");
	// Derive a hierarchical filename that is compatible with file system
	// naming conventions.
	var baseFilename;
	if(!draftOf) {
		// For non-draft tiddlers now use the hierarchical file system storage
		baseFilename = title.replace(/^\$:\//, HierarchicalFileSystemAdaptor.prototype.SYSTEM_FOLDER + "/");
		baseFilename = baseFilename.replace(/\<|\>|\:|\"|\\|\||\?|\*|\^/g,"_");
	} else {
		// Draft tiddlers go into their own flat drafts folder...	
		baseFilename = HierarchicalFileSystemAdaptor.prototype.DRAFT_FOLDER + "/";
		baseFilename += title.replace(/\<|\>|\:|\"|\/|\\|\||\?|\*|\^/g,"_");
	}
	// Finally ensure that all slashes get converted into the appropriate
	// platform-specific path separator.
	baseFilename = baseFilename.replace(/\//g, path.sep);
	
	// Truncate the filename if it is too long
	if(baseFilename.length > 200) {
		baseFilename = baseFilename.substr(0,200);
	}
	// Start with the base filename plus the extension
	var filename = baseFilename + extension,
		count = 1;
	// Add a discriminator if we're clashing with an existing filename
	while(existingFilenames.indexOf(filename) !== -1) {
		filename = baseFilename + " " + (count++) + extension;
	}
	return filename;
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
HierarchicalFileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	var self = this;
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		var template, content, encoding;
		function _finish() {
			if(self.pending[fileInfo.filepath]) {
				self.setwatcher(fileInfo.filepath, tiddler.fields.title);
				delete self.pending[fileInfo.filepath];
			}
			callback(null, {}, 0);
		}
		if(err) {
			return callback(err);
		}
		if(self.watchers[fileInfo.filepath]) {
			self.watchers[fileInfo.filepath].close();
			delete self.watchers[fileInfo.filepath];
			self.pending[fileInfo.filepath] = tiddler.fields.title;
		}
		// ensure that the required sub directory is present. Then try to
		// save the tiddler to its file or only its metadata to a separate
		// metadata file.
		self.mkdirp(path.dirname(fileInfo.filepath), function(err) {
			if(err) {
				return callback(err);
			}
			if(fileInfo.hasMetaFile) {
				// Save the tiddler as a separate body and meta file
				var typeInfo = $tw.config.contentTypeInfo[fileInfo.type];
				fs.writeFile(fileInfo.filepath,tiddler.fields.text,{encoding: typeInfo.encoding},function(err) {
					if(err) {
						return callback(err);
					}
					content = self.wiki.renderTiddler("text/plain","$:/core/templates/tiddler-metadata",{variables: {currentTiddler: tiddler.fields.title}});
					fs.writeFile(fileInfo.filepath + ".meta",content,{encoding: "utf8"},function (err) {
						if(err) {
							return callback(err);
						}
						self.logger.log("Saved file",fileInfo.filepath);
						_finish();
					});
				});
			} else {
				// Save the tiddler as a self contained templated file
				template = $tw.config.typeTemplates[fileInfo.type];
				content = self.wiki.renderTiddler("text/plain",template,{variables: {currentTiddler: tiddler.fields.title}});
				fs.writeFile(fileInfo.filepath,content,{encoding: "utf8"},function (err) {
					if(err) {
						return callback(err);
					}
					self.logger.log("Saved file",fileInfo.filepath);
					_finish();
				});
			}
		});
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.
*/
HierarchicalFileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
HierarchicalFileSystemAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this,
		fileInfo = $tw.boot.files[title];
	// Only delete the tiddler if we have writable information for the file
	if(fileInfo) {
		if(this.watchers[fileInfo.filepath]) {
			this.watchers[fileInfo.filepath].close();
			delete this.watchers[fileInfo.filepath];
		}
		delete this.pending[fileInfo.filepath];
		// Delete the file
		fs.unlink(fileInfo.filepath,function(err) {
			if(err) {
				return callback(err);
			}
			self.logger.log("Deleted file",fileInfo.filepath);
			// Delete the metafile if present
			if(fileInfo.hasMetaFile) {
				fs.unlink(fileInfo.filepath + ".meta",function(err) {
					if(err) {
						return callback(err);
					}
					callback(null);
				});
			} else {
				callback(null);
			}
		});
	} else {
		callback(null);
	}
};

if(fs) {
	exports.adaptorClass = HierarchicalFileSystemAdaptor;
}

})();
