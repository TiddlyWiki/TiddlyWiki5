/*\
title: $:/plugins/dropbox/dropbox.js
type: application/javascript
module-type: startup

Startup the Dropbox integration plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Obfuscated API key
var apiKey = "m+qwjj8wFRA=|1TSoitGS9Nz2RTwv+jrUJnsAj0yy57NhQJ4TkZ/+Hw==";

// Tiddler titles
var titleIsLoggedIn = "$:/plugins/dropbox/IsLoggedIn",
	titleUserName = "$:/plugins/dropbox/UserName",
	titlePublicAppUrl = "$:/plugins/dropbox/PublicAppUrl",
	titleAppTemplateHtml = "$:/plugins/dropbox/apptemplate.html";

// Query string marker for forcing authentication
var queryLoginMarker = "login=true";

$tw.plugins.dropbox = {
	client: null // Dropbox.js client object
};

// Error handling
$tw.plugins.dropbox.showError = function(error) {
	alert("Dropbox error: " + error);
	console.log("Dropbox error: " + error);
};

// Authenticate
$tw.plugins.dropbox.login = function() {
	$tw.plugins.dropbox.client.authenticate(function(error, client) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Mark us as logged in
		$tw.wiki.addTiddler({title: titleIsLoggedIn, text: "yes"},true);
		// Get user information
		$tw.plugins.dropbox.getUserInfo(function() {
			// Invoke any dropbox-startup modules
			var mods = $tw.modules.types["dropbox-startup"];
			for(var m=0; m<mods.length; m++) {
				mods[m].startup();
			}
		});
	});
};

// Get user information
$tw.plugins.dropbox.getUserInfo = function(callback) {
	$tw.plugins.dropbox.client.getUserInfo(function(error,userInfo) {
		if(error) {
			callback(error);
			return $tw.plugins.dropbox.showError(error);
		}
		$tw.plugins.dropbox.userInfo = userInfo;
		// Save the username
		$tw.wiki.addTiddler({title: titleUserName, text: userInfo.name},true);
		callback();
	});
};

// Logout
$tw.plugins.dropbox.logout = function() {
	$tw.plugins.dropbox.client.signOut(function(error) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Mark us as logged out
		$tw.wiki.deleteTiddler(titleUserName);
		$tw.wiki.addTiddler({title: titleIsLoggedIn, text: "no"},true);
		// Remove any marker from the query string
		document.location.search = "";
	});
};

// Load tiddlers representing each wiki in a folder
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

// Load tiddler files from a folder
$tw.plugins.dropbox.loadTiddlerFiles = function(path,callback) {
	// First get the list of tiddler files
	$tw.plugins.dropbox.client.stat(path,{readDir: true},function(error,stat,stats) {
		if(error) {
			return $tw.plugins.dropbox.showError(error);
		}
		// Process the files via an asynchronous queue, with concurrency set to 2 at a time
		var q = async.queue(function(task,callback) {
			$tw.plugins.dropbox.loadTiddlerFile(task.path,task.type,task.stats,callback);
		}, 2);
		// Call the callback when we've processed all the files
		q.drain = callback;
		// Push a task onto the queue for each file to be processed
		for(var s=0; s<stats.length; s++) {
			var stat = stats[s],
				isMetaFile = stat.path.lastIndexOf(".meta") === stat.path.length - 5;
			if(stat.isFile && !stat.isFolder && !isMetaFile) {
				q.push({path: stat.path, type: stat.mimeType, stats: stats});
			}
		}
	});
};

// Load a tiddler file
$tw.plugins.dropbox.loadTiddlerFile = function(path,mimeType,stats,callback) {
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
	var xhr = $tw.plugins.dropbox.client.readFile(path,{binary: isBinary},function(error,data) {
		if(error) {
			callback(error);
			return $tw.plugins.dropbox.showError(error);
		}
		// Deserialise the tiddler(s) out of the text
		var tiddlers;
		if(isBinary) {
			tiddlers = [{
				title: path,
				text: $tw.plugins.dropbox.base64EncodeString(data),
				type: mimeType
			}];
		} else {
			tiddlers = $tw.wiki.deserializeTiddlers(mimeType,data,{title: path});
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
			$tw.plugins.dropbox.client.readFile(metafilePath,function(error,data) {
				if(error) {
					callback(error);
					return $tw.plugins.dropbox.showError(error);
				}
				tiddlers = [$tw.utils.parseFields(data,tiddlers[0])];
				$tw.wiki.addTiddlers(tiddlers);
				callback();
			});
		} else {
			$tw.wiki.addTiddlers(tiddlers);
			callback();
		}
	});
};

// Encode a binary file as returned by Dropbox into the base 64 equivalent
// Adapted from Jon Leighton, https://gist.github.com/958841
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

// Rewrite the document location to include a force login marker
$tw.plugins.dropbox.forceLogin = function() {
	if(document.location.search.indexOf(queryLoginMarker) === -1) {
		document.location.search = queryLoginMarker;
	}
};

// Create a new empty TiddlyWiki
$tw.plugins.dropbox.createWiki = function(wikiName) {
	// Remove any dodgy characters from the wiki name
	wikiName = wikiName.replace(/[\$\:\?\#\/\\]/g,"");
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
	        var tiddler = $tw.wiki.getTiddler(titleAppTemplateHtml);
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
	function(err,results) {
		alert("Created wiki " + wikiName + " error " + err);
	});
};

exports.startup = function() {
	if(!$tw.browser) {
		return;
	}
	// Mark us as not logged in
	$tw.wiki.addTiddler({title: titleIsLoggedIn, text: "no"},true);
	// Initialise Dropbox for sandbox access
	$tw.plugins.dropbox.client = new Dropbox.Client({key: apiKey, sandbox: true});
	// Use the basic redirection authentication driver
	$tw.plugins.dropbox.client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));
	// Authenticate ourselves if the marker is in the document query string
	if(document.location.search.indexOf(queryLoginMarker) !== -1) {
		$tw.plugins.dropbox.login();
	}
};

})();
