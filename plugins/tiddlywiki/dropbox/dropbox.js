/*\
title: $:/plugins/tiddlywiki/dropbox/dropbox.js
type: application/javascript
module-type: browser-startup

Main Dropbox integration module. It creates the `$tw.plugins.dropbox` object that includes static methods for various Dropbox operations. It also contains a startup function that kicks off the login process

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Obfuscated API key
var apiKey = "m+qwjj8wFRA=|1TSoitGS9Nz2RTwv+jrUJnsAj0yy57NhQJ4TkZ/+Hw==";

// Query string marker for forcing authentication
var queryLoginMarker = "login=true";

// Require async.js
var async = require("./async.js");

$tw.plugins.dropbox = {
	// State data
	client: null, // Dropbox.js client object
	fileInfo: {}, // Hashmap of each filename as retrieved from Dropbox (including .meta files): {versionTag:,title:}
	titleInfo: {}, // Hashmap of each tiddler title retrieved from Dropbox to filename
	// Titles of various shadow tiddlers used by the plugin
	titleIsLoggedIn: "$:/plugins/dropbox/IsLoggedIn",
	titleUserName: "$:/plugins/dropbox/UserName",
	titlePublicAppUrl: "$:/plugins/dropbox/PublicAppUrl",
	titleAppTemplateHtml: "$:/plugins/dropbox/apptemplate.html",
	titleTiddlerIndex: "$:/plugins/dropbox/Index",
	titleAppIndexTemplate: "$:/plugins/dropbox/index.template.html",
	titleWikiName: "$:/plugins/dropbox/WikiName",
	titleLoadedWikis: "$:/plugins/dropbox/LoadedWikis"
};

/*
Startup function that sets up Dropbox and, if the queryLoginMarker is present, logs the user in. After login, any dropbox-startup modules are executed.
*/
exports.startup = function() {
	if(!$tw.browser) {
		return;
	}
	// Mark us as not logged in
	$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleIsLoggedIn, text: "no"},true);
	// Initialise Dropbox for sandbox access
	$tw.plugins.dropbox.client = new Dropbox.Client({key: apiKey, sandbox: true});
	// Use the basic redirection authentication driver
	$tw.plugins.dropbox.client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));
	// Authenticate ourselves if the marker is in the document query string
	if(document.location.search.indexOf(queryLoginMarker) !== -1) {
		$tw.plugins.dropbox.login();
	} else {
		$tw.plugins.dropbox.invokeDropboxStartupModules(false);
	}
};

/*
Error handling
*/
$tw.plugins.dropbox.showError = function(error) {
	alert("Dropbox error: " + error);
	console.log("Dropbox error: " + error);
};

/*
Authenticate
*/
$tw.plugins.dropbox.login = function() {
	$tw.plugins.dropbox.client.authenticate(function(error, client) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Mark us as logged in
		$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleIsLoggedIn, text: "yes"},true);
		// Get user information
		$tw.plugins.dropbox.getUserInfo(function() {
			// Invoke any dropbox-startup modules
			$tw.plugins.dropbox.invokeDropboxStartupModules(true);
		});
	});
};

/*
Invoke any dropbox-startup modules
*/
$tw.plugins.dropbox.invokeDropboxStartupModules = function(loggedIn) {
	$tw.modules.forEachModuleOfType("dropbox-startup",function(title,module) {
		module.startup(loggedIn);
	});
};

/*
Get user information
*/
$tw.plugins.dropbox.getUserInfo = function(callback) {
	$tw.plugins.dropbox.client.getUserInfo(function(error,userInfo) {
		if(error) {
			callback(error);
			return $tw.plugins.dropbox.showError(error);
		}
		$tw.plugins.dropbox.userInfo = userInfo;
		// Save the username
		$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleUserName, text: userInfo.name},true);
		callback();
	});
};

/*
Logout
*/
$tw.plugins.dropbox.logout = function() {
	$tw.plugins.dropbox.client.signOut(function(error) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Mark us as logged out
		$tw.wiki.deleteTiddler($tw.plugins.dropbox.titleUserName);
		$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleIsLoggedIn, text: "no"},true);
		// Remove any marker from the query string
		document.location.search = "";
	});
};

/*
Load tiddlers representing each wiki in a folder
*/
$tw.plugins.dropbox.loadWikiFiles = function(path,callback) {
	// First get the list of tiddler files
	$tw.plugins.dropbox.client.stat(path,{readDir: true},function(error,stat,stats) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Create a tiddler for each folder
		for(var s=0; s<stats.length; s++) {
			var stat = stats[s];
			if(!stat.isFile && stat.isFolder) {
				var url = $tw.plugins.dropbox.userInfo.publicAppUrl + stat.path + "/index.html";
				$tw.wiki.addTiddler({title: "'" + stat.name + "'", text: "wiki", tags: ["wiki"], wikiName: stat.name, urlView: url, urlEdit: url + "?login=true"});
			}
		}
		callback();
	});
};

/*
Synchronise the local state with the files in Dropbox
*/
$tw.plugins.dropbox.refreshTiddlerFiles = function(path,callback) {
	// First get the list of tiddler files
	$tw.plugins.dropbox.client.stat(path,{readDir: true},function(error,stat,stats) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Make a hashmap of each of the file names
		var filenames = {},f,hadDeletions;
		for(f=0; f<stats.length; f++) {
			filenames[stats[f].name] = true;
		}
console.log("filenames",filenames);
console.log("fileinfo",$tw.plugins.dropbox.fileInfo)
		// Check to see if any files have been deleted, and remove the associated tiddlers
		for(f in $tw.plugins.dropbox.fileInfo) {
			if(!$tw.utils.hop(filenames,f)) {
				$tw.wiki.deleteTiddler($tw.plugins.dropbox.fileInfo[f].title);
				hadDeletions = true;
			}
		}
		// Process the files via an asynchronous queue, with concurrency set to 2 at a time
		var q = async.queue(function(task,callback) {
			$tw.plugins.dropbox.loadTiddlerFile(task.path,task.type,task.stats,callback);
		}, 2);
		// Call the callback when we've processed all the files
		q.drain = function () {
			callback(true); // Indicate that there were changes
		};
		// Push a task onto the queue for each file to be processed
		for(var s=0; s<stats.length; s++) {
			var stat = stats[s],
				isMetaFile = stat.path.lastIndexOf(".meta") === stat.path.length - 5;
			if(stat.isFile && !stat.isFolder && !isMetaFile) {
				// Don't load the file if the version tag shows it hasn't changed
				var fileInfo = $tw.plugins.dropbox.fileInfo[stat.name] || {},
					hasChanged = stat.versionTag !== fileInfo.versionTag;
				if(!hasChanged) {
					// Check if there is a metafile and whether it has changed
					var metafileName = stat.name + ".meta";
					for(var p=0; p<stats.length; p++) {
						if(stats[p].name === metafileName) {
							fileInfo = $tw.plugins.dropbox.fileInfo[metafileName] || {};
							hasChanged = stats[p].versionTag !== fileInfo.versionTag;
						}
					}
				}
				if(hasChanged) {
					q.push({path: stat.path, type: stat.mimeType, stats: stats});
				}
			}
		}
		// If we didn't queue anything for loading we'll have to manually trigger our callback
		if(q.length() === 0) {
			callback(hadDeletions); // And tell it that there are changes if there were deletions
		}
	});
};

/*
Load a tiddler file
*/
$tw.plugins.dropbox.loadTiddlerFile = function(path,mimeType,stats,callback) {
console.log("loading tiddler from",path);
	// If the mime type is "application/octet-stream" then we'll take the type from the extension
	var isBinary = false,
		p = path.lastIndexOf(".");
	if(mimeType === "application/octet-stream" && p !== -1) {
		var ext = path.substr(p);
		if($tw.utils.hop($tw.config.fileExtensionInfo,ext)) {
			mimeType = $tw.config.fileExtensionInfo[ext].type;
		}
	}
	if($tw.utils.hop($tw.config.contentTypeInfo,mimeType)) {
		isBinary = $tw.config.contentTypeInfo[mimeType].encoding === "base64";
	}
	var xhr = $tw.plugins.dropbox.client.readFile(path,{binary: isBinary},function(error,data,stat) {
		if(error) {
			callback(error);
			return $tw.plugins.dropbox.showError(error);
		}
		// Compute the default title
		var defaultTitle = path,
			p = path.lastIndexOf("/");
		if(p !== -1) {
			defaultTitle = path.substr(p+1);
		}
		// Deserialise the tiddler(s) out of the text
		var tiddlers;
		if(isBinary) {
			tiddlers = [{
				title: defaultTitle,
				text: $tw.plugins.dropbox.base64EncodeString(data),
				type: mimeType
			}];
		} else {
			tiddlers = $tw.wiki.deserializeTiddlers(mimeType,data,{title: defaultTitle});
		}
		// Check to see if there's a metafile
		var	metafilePath = path + ".meta",
			metafileIndex = null;
		for(var t=0; t<stats.length; t++) {
			if(stats[t].path === metafilePath) {
				metafileIndex = t;
			}
		}
		// Process the metafile if it's there
		if(tiddlers.length === 1 && metafileIndex !== null) {
			var mainStat = stat;
			$tw.plugins.dropbox.client.readFile(metafilePath,function(error,data,stat) {
				if(error) {
					callback(error);
					return $tw.plugins.dropbox.showError(error);
				}
				// Extract the metadata and add the tiddlers
				tiddlers = [$tw.utils.parseFields(data,tiddlers[0])];
				$tw.wiki.addTiddlers(tiddlers);
				// Save the revision of the files so we can detect changes later
				$tw.plugins.dropbox.fileInfo[mainStat.name] = {versionTag: mainStat.versionTag,title: tiddlers[0].title};
				$tw.plugins.dropbox.titleInfo[tiddlers[0].title] = mainStat.name;
				$tw.plugins.dropbox.fileInfo[stat.name] = {versionTag: stat.versionTag,title: tiddlers[0].title};
				callback();
			});
		} else {
			// Add the tiddlers
			$tw.wiki.addTiddlers(tiddlers);
			// Save the revision of this file so we can detect changes
			$tw.plugins.dropbox.fileInfo[stat.name] = {versionTag: stat.versionTag,title: tiddlers[0].title};
			for(t=0; t<tiddlers.length; t++) {
				$tw.plugins.dropbox.titleInfo[tiddlers[t].title] = stat.name;
			}
			callback();
		}
	});
};

/*
Encode a binary file as returned by Dropbox into the base 64 equivalent
Adapted from Jon Leighton, https://gist.github.com/958841
*/
$tw.plugins.dropbox.base64EncodeString = function(data) {
	var base64 = [],
		charmap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
		byteRemainder = data.length % 3,
		mainLength = data.length - byteRemainder,
		a, b, c, d,
		chunk;
	// Main loop deals with bytes in chunks of 3
	for(var i=0; i<mainLength; i=i+3) {
		// Combine the three bytes into a single integer
		chunk = (data.charCodeAt(i) << 16) | (data.charCodeAt(i + 1) << 8) | data.charCodeAt(i + 2);
		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
		d = chunk & 63;               // 63       = 2^6 - 1
		// Convert the raw binary segments to the appropriate ASCII encoding
		base64.push(charmap[a],charmap[b],charmap[c],charmap[d]);
	}
	// Deal with the remaining bytes and padding
	if(byteRemainder === 1) {
		chunk = data[mainLength];
		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
		// Set the 4 least significant bits to zero
		b = (chunk & 3)   << 4; // 3   = 2^2 - 1
		base64.push(charmap[a],charmap[b],"==");
	} else if(byteRemainder === 2) {
		chunk = (data[mainLength] << 8) | data[mainLength + 1];
		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4
		// Set the 2 least significant bits to zero
		c = (chunk & 15)    <<  2; // 15    = 2^4 - 1
		base64.push(charmap[a],charmap[b],charmap[c],"=");
	}
	return base64.join("");
};

/*
Rewrite the document location to include a force login marker
*/
$tw.plugins.dropbox.forceLogin = function() {
	if(document.location.search.indexOf(queryLoginMarker) === -1) {
		document.location.search = queryLoginMarker;
	}
};

/*
Create a new empty TiddlyWiki
*/
$tw.plugins.dropbox.createWiki = function(wikiName) {
	// Remove any dodgy characters from the wiki name
	wikiName = wikiName.replace(/[\!\@\€\£\%\^\*\+\$\:\?\#\/\\\<\>\|\"\'\`\~\=]/g,"");
	// Check that the name isn't now empty
	if(wikiName.length === 0) {
		return alert("Bad wiki name");
	}
	// Create the wiki
	async.series([
	    function(callback) {
	        // First create the wiki folder
	        $tw.plugins.dropbox.client.mkdir(wikiName,function(error,stat) {
		        callback(error);
	        });
	    },
	    function(callback) {
	        // Second create the tiddlers folder
	        $tw.plugins.dropbox.client.mkdir(wikiName + "/tiddlers",function(error,stat) {
		        callback(error);
	        });
	    },
	    function(callback) {
	        // Third save the template app HTML file
	        var tiddler = $tw.wiki.getTiddler($tw.plugins.dropbox.titleAppTemplateHtml);
	        if(!tiddler) {
	        	callback("Cannot find app template tiddler");
	        } else {
		        $tw.plugins.dropbox.client.writeFile(wikiName + "/index.html",tiddler.fields.text,function(error,stat) {
			        callback(error);
		        });
	        }
	    }
	],
	// optional callback
	function(error,results) {
		if(error) {
			$tw.plugins.dropbox.showError(error);
		} else {
			alert("Created wiki " + wikiName);
		}
	});
};

/*
Save the index file
*/
$tw.plugins.dropbox.saveTiddlerIndex = function(path,callback) {
	// Get the tiddler index information
	var index = {tiddlers: [],shadows: [], fileInfo: $tw.plugins.dropbox.fileInfo};
	// First all the tiddlers
	$tw.wiki.forEachTiddler(function(title,tiddler) {
		if(tiddler.isShadow) {
			index.shadows.push(tiddler.fields);
		} else {
			index.tiddlers.push(tiddler.fields);
		}
	});
	// Save everything to a tiddler
	$tw.wiki.addTiddler({title: $tw.plugins.dropbox.titleTiddlerIndex, type: "application/json", text: JSON.stringify(index,null,$tw.config.preferences.jsonSpaces)},true);
	// Generate the index file
	var file = $tw.wiki.renderTiddler("text/plain",$tw.plugins.dropbox.titleAppIndexTemplate);
	// Save the index to Dropbox
    $tw.plugins.dropbox.client.writeFile(path,file,function(error,stat) {
        callback(error);
    });
};

/*
Setup synchronisation back to Dropbox
*/
$tw.plugins.dropbox.setupSyncer = function(wiki) {
	wiki.addEventListener("",function(changes) {
		$tw.plugins.dropbox.syncChanges(changes,wiki);
	});
};

$tw.plugins.dropbox.syncChanges = function(changes,wiki) {
	// Create a queue of tasks to save or delete tiddlers
	var q = async.queue($tw.plugins.dropbox.syncTask,2);
	// Called when we've processed all the files
	q.drain = function () {
	};
	// Process each of the changes
	for(var title in changes) {
		var tiddler = wiki.getTiddler(title),
			filename = $tw.plugins.dropbox.titleInfo[title],
			contentType = tiddler ? tiddler.fields.type : null;
		contentType = contentType || "text/vnd.tiddlywiki";
		var contentTypeInfo = $tw.config.contentTypeInfo[contentType],
			isNew = false;
		// Figure out the pathname of the tiddler
		if(!filename) {
			var extension = contentTypeInfo ? contentTypeInfo.extension : "";
			filename = encodeURIComponent(title) + extension;
			$tw.plugins.dropbox.titleInfo[title] = filename;
			isNew = true;
		}
		// Push the appropriate task
		if(tiddler) {
			if(contentType === "text/vnd.tiddlywiki") {
				// .tid file
				q.push({
					type: "save",
					title: title,
					path: $tw.plugins.dropbox.titleInfo[title],
					content: wiki.serializeTiddlers([tiddler],"application/x-tiddler"),
					isNew: isNew
				});
			} else {
				// main file plus meta file
				q.push({
					type: "save",
					title: title,
					path: $tw.plugins.dropbox.titleInfo[title],
					content: tiddler.fields.text,
					metadata: tiddler.getFieldStringBlock({exclude: ["text"]}),
					isNew: isNew
				});
			}
		} else {
			q.push({
				type: "delete",
				title: title,
				path: $tw.plugins.dropbox.titleInfo[title]
			});
		}
	}
};

/*
Perform a single sync task
*/
$tw.plugins.dropbox.syncTask = function(task,callback) {
	if(task.type === "delete") {
console.log("Deleting",task.path);
	} else if(task.type === "save") {
console.log("Saving",task.path,task);
	}
};

})();
