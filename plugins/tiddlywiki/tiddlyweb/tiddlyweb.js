/*\
title: $:/plugins/tiddlywiki/tiddlyweb/tiddlyweb.js
type: application/javascript
module-type: syncer

Main TiddlyWeb syncer module

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Creates a TiddlyWebSyncer object
*/
var TiddlyWebSyncer = function(options) {
	this.wiki = options.wiki;
	this.connection = undefined;
	this.tiddlerInfo = {}; // Hashmap of {revision:,changeCount:}
	// Tasks are {type: "load"/"save", title:, queueTime:, lastModificationTime:}
	this.taskQueue = {}; // Hashmap of tasks to be performed
	this.taskInProgress = {}; // Hashmap of tasks in progress
};

TiddlyWebSyncer.titleIsLoggedIn = "$:/plugins/tiddlyweb/IsLoggedIn";
TiddlyWebSyncer.titleUserName = "$:/plugins/tiddlyweb/UserName";

/*
Error handling
*/
TiddlyWebSyncer.prototype.showError = function(error) {
	alert("TiddlyWeb error: " + error);
	console.log("TiddlyWeb error: " + error);
};

TiddlyWebSyncer.prototype.addConnection = function(connection) {
	var self = this;
	// Check if we've already got a connection
	if(this.connection) {
		return new Error("TiddlyWebSyncer can only handle a single connection");
	}
	// Check the connection has its constituent parts
	if(!connection.host || !connection.recipe) {
		return new Error("Missing connection data");
	}
	// Mark us as not logged in
	this.wiki.addTiddler({title: TiddlyWebSyncer.titleIsLoggedIn,text: "no"});
	// Save and return the connection object
	this.connection = connection;
	// Listen out for changes to tiddlers
	this.wiki.addEventListener("",function(changes) {
		self.syncToServer(changes);
	});
	// Get the login status
	this.getStatus(function (err,isLoggedIn,json) {
		if(isLoggedIn) {
			self.syncFromServer();
		}
	});
	return ""; // We only support a single connection
};

/*
Handle syncer messages
*/
TiddlyWebSyncer.prototype.handleEvent = function(event) {
	switch(event.type) {
		case "tw-login":
			this.promptLogin();
			break;
		case "tw-logout":
			this.logout();
			break;
	}
};

/*
Invoke any tiddlyweb-startup modules
*/
TiddlyWebSyncer.prototype.invokeTiddlyWebStartupModules = function(loggedIn) {
	$tw.modules.forEachModuleOfType("tiddlyweb-startup",function(title,module) {
		module.startup(loggedIn);
	});

};

TiddlyWebSyncer.prototype.getCsrfToken = function() {
	var regex = /^(?:.*; )?csrf_token=([^(;|$)]*)(?:;|$)/,
		match = regex.exec(document.cookie),
		csrf = null;
	if (match && (match.length === 2)) {
		csrf = match[1];
	}
	return csrf;

};

TiddlyWebSyncer.prototype.getStatus = function(callback) {
	// Get status
	var self = this;
	this.httpRequest({
		url: this.connection.host + "status",
		callback: function(err,data) {
			if(err) {
				return callback(err);
			}
			// Decode the status JSON
			var json = null;
			try {
				json = JSON.parse(data);
			} catch (e) {
			}
			if(json) {
				// Check if we're logged in
				var isLoggedIn = json.username !== "GUEST";
				// Set the various status tiddlers
				self.wiki.addTiddler({title: TiddlyWebSyncer.titleIsLoggedIn,text: isLoggedIn ? "yes" : "no"});
				if(isLoggedIn) {
					self.wiki.addTiddler({title: TiddlyWebSyncer.titleUserName,text: json.username});
				} else {
					self.wiki.deleteTiddler(TiddlyWebSyncer.titleUserName);
				}
			}
			// Invoke the callback if present
			if(callback) {
				callback(null,isLoggedIn,json);
			}
		}
	});
};

/*
Dispay a password prompt and allow the user to login
*/
TiddlyWebSyncer.prototype.promptLogin = function() {
	var self = this;
	this.getStatus(function(isLoggedIn,json) {
		if(!isLoggedIn) {
			$tw.passwordPrompt.createPrompt({
				serviceName: "Login to TiddlySpace",
				callback: function(data) {
					self.login(data.username,data.password,function(err,isLoggedIn) {
						self.syncFromServer();
					});
					return true; // Get rid of the password prompt
				}
			});
		}
	});
};

/*
Attempt to login to TiddlyWeb.
	username: username
	password: password
	callback: invoked with arguments (err,isLoggedIn)
*/
TiddlyWebSyncer.prototype.login = function(username,password,callback) {
	var self = this;
	var httpRequest = this.httpRequest({
		url: this.connection.host + "challenge/tiddlywebplugins.tiddlyspace.cookie_form",
		type: "POST",
		data: {
			user: username,
			password: password,
			tiddlyweb_redirect: "/status" // workaround to marginalize automatic subsequent GET
		},
		callback: function(err,data) {
			if(err) {
				if(callback) {
					callback(err);
				}
			} else {
				self.getStatus(function(err,isLoggedIn,json) {
					if(callback) {
						callback(null,isLoggedIn);
					}
				});
			}
		}
	});
};

/*
Attempt to log out of TiddlyWeb
*/
TiddlyWebSyncer.prototype.logout = function(options) {
	options = options || {};
	var self = this;
	var httpRequest = this.httpRequest({
		url: this.connection.host + "logout",
		type: "POST",
		data: {
			csrf_token: this.getCsrfToken(),
			tiddlyweb_redirect: "/status" // workaround to marginalize automatic subsequent GET
		},
		callback: function(err,data) {
			if(err) {
				self.showError("logout error: " + err);
			} else {
				self.getStatus();
			}
		}
	});
};

/*
Convert a TiddlyWeb JSON tiddler into a TiddlyWiki5 tiddler and save it in the store
*/
TiddlyWebSyncer.prototype.storeTiddler = function(tiddlerFields,revision) {
	var result = {};
	// Transfer the fields, pulling down the `fields` hashmap
	$tw.utils.each(tiddlerFields,function(element,title,object) {
		switch(title) {
			case "fields":
				$tw.utils.each(element,function(element,subTitle,object) {
					result[subTitle] = element;
				});
				break;
			default:
				result[title] = tiddlerFields[title];
				break;
		}
	});
	// Some unholy freaking of content types
	if(result.type === "text/javascript") {
		result.type = "application/javascript";
	} else if(!result.type || result.type === "None") {
		result.type = "text/vnd.tiddlywiki2";
	}
	// Save the tiddler
	this.wiki.addTiddler(new $tw.Tiddler(result));
	// Save the tiddler revision and changeCount details
	this.tiddlerInfo[result.title] = {
		revision: revision,
		changeCount: this.wiki.getChangeCount(result.title)
	};
};

/*
Synchronise from the server by reading the tiddler list from the recipe and queuing up GETs for any tiddlers that we don't already have
*/
TiddlyWebSyncer.prototype.syncFromServer = function() {
	var self = this;
	this.httpRequest({
		url: this.connection.host + "recipes/" + this.connection.recipe + "/tiddlers.json",
		callback: function(err,data) {
			if(err) {
console.log("error in syncFromServer",err);
				return;
			}
			var json = JSON.parse(data);
			for(var t=0; t<json.length; t++) {
				self.storeTiddler(json[t],json[t].revision);
			}
		}
	});
};

/*
Synchronise a set of changes to the server
*/
TiddlyWebSyncer.prototype.syncToServer = function(changes) {
	var self = this,
		now = new Date();
	$tw.utils.each(changes,function(element,title,object) {
		// Queue a task to sync this tiddler
		self.enqueueSyncTask({
			type: "save",
			title: title,
			queueTime: now,
			lastModificationTime: now
		});
	});
};

/*
Queue up a sync task. If there is already a pending task for the tiddler, just update the last modification time
*/
TiddlyWebSyncer.prototype.enqueueSyncTask = function(task) {
	// Bail if it's not a tiddler we know about
	if(!$tw.utils.hop(this.tiddlerInfo,task.title)) {
		return;
	}
	// Bail if the tiddler is already at the changeCount that the server has
	if(this.wiki.getChangeCount(task.title) <= this.tiddlerInfo[task.title].changeCount) {
		return;
	}
	// Check if this tiddler is already in the queue
	if($tw.utils.hop(this.taskQueue,task.title)) {
		this.taskQueue[task.title].lastModificationTime = task.lastModificationTime;
	} else {
		// If it is not in the queue, insert it
		this.taskQueue[task.title] = task;
	}
};

/*
Lazily load a skinny tiddler if we can
*/
TiddlyWebSyncer.prototype.lazyLoad = function(connection,title,tiddler) {
	var self = this;
	this.httpRequest({
		url: this.connection.host + "recipes/" + this.connection.recipe + "/tiddlers/" + title,
		callback: function(err,data,request) {
			if(err) {
console.log("error in lazyLoad",err);
				return;
			}
			var etag = request.getResponseHeader("Etag"),
				revision = etag.split("/")[2].split(":")[0]; // etags are like "system-images_public/unsyncedIcon/946151:9f11c278ccde3a3149f339f4a1db80dd4369fc04"
			self.storeTiddler(JSON.parse(data),revision);
		}
	});
};

/*
A quick and dirty HTTP function; to be refactored later. Options are:
	url: URL to retrieve
	type: GET, PUT, POST etc
	callback: function invoked with (err,data)
*/
TiddlyWebSyncer.prototype.httpRequest = function(options) {
	var type = options.type || "GET",
		headers = options.headers || {accept: "application/json"},
		request = new XMLHttpRequest(),
		data = "",
		f,results;
	// Massage the data hashmap into a string
	if(options.data) {
		if(typeof options.data === "string") { // Already a string
			data = options.data;
		} else { // A hashmap of strings
			results = [];
			$tw.utils.each(options.data,function(element,title,object) {
				results.push(title + "=" + encodeURIComponent(element));
			});
			data = results.join("&")
		}
	}
	// Set up the state change handler
	request.onreadystatechange = function() {
		if(this.readyState === 4) {
			if(this.status === 200) {
				// success!
				options.callback(null,this.responseText,this);
				return;
			}
		// something went wrong
		options.callback(new Error("XMLHttpRequest error: " + this.status));
		}
	};
	// Make the request
	request.open(type,options.url,true);
	if(headers) {
		$tw.utils.each(headers,function(element,title,object) {
			request.setRequestHeader(title,element);
		});
	}
	if(data) {
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8");
	}
	request.send(data);
	return request;
};

// Only export anything on the browser
if($tw.browser) {
	exports.name = "tiddlywebsyncer";
	exports.syncer = TiddlyWebSyncer;
}

})();
