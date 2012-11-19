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
	this.taskInProgress = {}; // Hash of tasks in progress
	this.taskTimerId = null; // Sync timer
};

TiddlyWebSyncer.titleIsLoggedIn = "$:/plugins/tiddlyweb/IsLoggedIn";
TiddlyWebSyncer.titleUserName = "$:/plugins/tiddlyweb/UserName";
TiddlyWebSyncer.taskTimerInterval = 1 * 1000; // Interval for sync timer
TiddlyWebSyncer.throttleInterval = 1 * 1000; // Defer saving tiddlers if they've changed in the last 1s...
TiddlyWebSyncer.fallbackInterval = 10 * 1000; // Unless the task is older than 10s
TiddlyWebSyncer.pollTimerInterval = 60 * 1000; // Interval for polling for changes on the server

/*
Error handling
*/
TiddlyWebSyncer.prototype.showError = function(error) {
	alert("TiddlyWeb error: " + error);
	console.log("TiddlyWeb error: " + error);
};

/*
Message logging
*/
TiddlyWebSyncer.prototype.log = function(/* arguments */) {
	var args = Array.prototype.slice.call(arguments,0);
	args[0] = "TiddlyWeb: " + args[0];
	$tw.utils.log.apply(null,args);
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
	this.log("Adding connection with recipe:",connection.recipe,"host:",connection.host);
	// Get the login status
	this.getStatus(function (err,isLoggedIn,json) {
		if(isLoggedIn) {
			// Do a sync
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
Lazily load a skinny tiddler if we can
*/
TiddlyWebSyncer.prototype.lazyLoad = function(connection,title,tiddler) {
	// Queue up a sync task to load this tiddler
	this.enqueueSyncTask({
		type: "load",
		title: title
	});
};

/*
Get the current status of the TiddlyWeb connection
*/
TiddlyWebSyncer.prototype.getStatus = function(callback) {
	// Get status
	var self = this;
	this.log("Getting status");
	this.httpRequest({
		url: this.connection.host + "status",
		callback: function(err,data) {
			if(err) {
				return callback(err);
			}
			// Decode the status JSON
			var json = null,
				isLoggedIn = false;
			try {
				json = JSON.parse(data);
			} catch (e) {
			}
			if(json) {
				// Check if we're logged in
				isLoggedIn = json.username !== "GUEST";
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
	this.log("Attempting to login as",username);
	var self = this,
		httpRequest = this.httpRequest({
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
					self.log("Returned from logging in with data:",data);
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
	this.log("Attempting to logout");
	var self = this,
		httpRequest = this.httpRequest({
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
				self.log("Returned from logging out with data:",data);
				self.getStatus();
			}
		}
	});
};

/*
Synchronise from the server by reading the tiddler list from the recipe and queuing up GETs for any tiddlers that we don't already have
*/
TiddlyWebSyncer.prototype.syncFromServer = function() {
	this.log("Retrieving skinny tiddler list");
	var self = this;
	this.httpRequest({
		url: this.connection.host + "recipes/" + this.connection.recipe + "/tiddlers.json",
		callback: function(err,data) {
			// Check for errors
			if(err) {
				self.log("Error retrieving skinny tiddler list:",err);
				return;
			}
			// Process each incoming tiddler
			var json = JSON.parse(data);
			for(var t=0; t<json.length; t++) {
				// Get the incoming tiddler fields, and the existing tiddler
				var tiddlerFields = json[t],
					incomingRevision = tiddlerFields.revision.toString(),
					tiddler = self.wiki.getTiddler(tiddlerFields.title),
					tiddlerInfo = self.tiddlerInfo[tiddlerFields.title],
					currRevision = tiddlerInfo ? tiddlerInfo.revision : null;
				// Ignore the incoming tiddler if it's the same as the revision we've already got
				if(currRevision !== incomingRevision) {
					// Do a full load if we've already got a fat version of the tiddler
					if(tiddler && tiddler.fields.text) {
						// Do a full load of this tiddler
						self.enqueueSyncTask({
							type: "load",
							title: tiddlerFields.title
						});
					} else {
						// Load the skinny version of the tiddler
						self.storeTiddler(tiddlerFields,incomingRevision);
					}
				}
			}
			// Trigger another sync
			window.setTimeout(function() {
				self.syncFromServer.call(self);
			},TiddlyWebSyncer.pollTimerInterval);
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
			title: title
		});
	});
};

/*
Queue up a sync task. If there is already a pending task for the tiddler, just update the last modification time
*/
TiddlyWebSyncer.prototype.enqueueSyncTask = function(task) {
	var self = this,
		now = new Date();
	// Set the timestamps on this task
	task.queueTime = now;
	task.lastModificationTime = now;
	// Bail if it's not a tiddler we know about
	if(!$tw.utils.hop(this.tiddlerInfo,task.title)) {
		return;
	}
	// Bail if this is a save and the tiddler is already at the changeCount that the server has
	if(task.type === "save" && this.wiki.getChangeCount(task.title) <= this.tiddlerInfo[task.title].changeCount) {
		return;
	}
	// Check if this tiddler is already in the queue
	if($tw.utils.hop(this.taskQueue,task.title)) {
		this.log("Re-queueing up sync task with type:",task.type,"title:",task.title);
		var existingTask = this.taskQueue[task.title];
		// If so, just update the last modification time
		existingTask.lastModificationTime = task.lastModificationTime;
		// If the new task is a save then we upgrade the existing task to a save. Thus a pending GET is turned into a PUT if the tiddler changes locally in the meantime. But a pending save is not modified to become a GET
		if(task.type === "save") {
			existingTask.type = "save";
		}
	} else {
		this.log("Queuing up sync task with type:",task.type,"title:",task.title);
		// If it is not in the queue, insert it
		this.taskQueue[task.title] = task;
	}
	// Process the queue
	$tw.utils.nextTick(function() {self.processTaskQueue.call(self);});
};

/*
Return the number of tasks in progress
*/
TiddlyWebSyncer.prototype.numTasksInProgress = function() {
	return $tw.utils.count(this.taskInProgress);
};

/*
Return the number of tasks in the queue
*/
TiddlyWebSyncer.prototype.numTasksInQueue = function() {
	return $tw.utils.count(this.taskQueue);
};

/*
Trigger a timeout if one isn't already outstanding
*/
TiddlyWebSyncer.prototype.triggerTimeout = function() {
	var self = this;
	if(!this.taskTimerId) {
		this.taskTimerId = window.setTimeout(function() {
			self.taskTimerId = null;
			self.processTaskQueue.call(self);
		},TiddlyWebSyncer.taskTimerInterval);
	}
};

/*
Process the task queue, performing the next task if appropriate
*/
TiddlyWebSyncer.prototype.processTaskQueue = function() {
	var self = this;
	// Only process a task if we're not already performing a task. If we are already performing a task then we'll dispatch the next one when it completes
	if(this.numTasksInProgress() === 0) {
		// Choose the next task to perform
		var task = this.chooseNextTask();
		// Perform the task if we had one
		if(task) {
			// Remove the task from the queue and add it to the in progress list
			delete this.taskQueue[task.title];
			this.taskInProgress[task.title] = task;
			// Dispatch the task
			this.dispatchTask(task,function(err) {
				// Mark that this task is no longer in progress
				delete self.taskInProgress[task.title];
				// Process the next task
				self.processTaskQueue.call(self);
			});
		} else {
			// Make sure we've set a time if there wasn't a task to perform, but we've still got tasks in the queue
			if(this.numTasksInQueue() > 0) {
				this.triggerTimeout();
			}
		}
	}
};

/*
Choose the next applicable task
*/
TiddlyWebSyncer.prototype.chooseNextTask = function() {
	var self = this,
		candidateTask = null,
		now = new Date();
	// Select the best candidate task
	$tw.utils.each(this.taskQueue,function(task,title) {
		// Exclude the task if there's one of the same name in progress
		if($tw.utils.hop(self.taskInProgress,title)) {
			return;
		}
		// Exclude the task if it is a save and the tiddler has been modified recently, but not hit the fallback time
		if(task.type === "save" && (now - task.lastModificationTime) < TiddlyWebSyncer.throttleInterval &&
			(now - task.queueTime) < TiddlyWebSyncer.fallbackInterval) {
			return;	
		}
		// Exclude the task if it is newer than the current best candidate
		if(candidateTask && candidateTask.queueTime < task.queueTime) {
			return;
		}
		// Now this is our best candidate
		candidateTask = task;
	});
	return candidateTask;
};

/*
Dispatch a task and invoke the callback
*/
TiddlyWebSyncer.prototype.dispatchTask = function(task,callback) {
	var self = this;
	if(task.type === "save") {
		var changeCount = this.wiki.getChangeCount(task.title);
		this.log("Dispatching 'save' task:",task.title);
		this.httpRequest({
			url: this.connection.host + "recipes/" + this.connection.recipe + "/tiddlers/" + task.title,
			type: "PUT",
			headers: {
				"Content-type": "application/json"
			},
			data: this.convertTiddlerToTiddlyWebFormat(task.title),
			callback: function(err,data,request) {
				if(err) {
					return callback(err);
				}
				// Save the details of the new revision of the tiddler
				var tiddlerInfo = self.tiddlerInfo[task.title];
				tiddlerInfo.changeCount = changeCount;
				tiddlerInfo.revision = self.getRevisionFromEtag(request);
				// Invoke the callback
				callback(null);	
			}
		});
	} else if(task.type === "load") {
		// Load the tiddler
		this.log("Dispatching 'load' task:",task.title);
		this.httpRequest({
			url: this.connection.host + "recipes/" + this.connection.recipe + "/tiddlers/" + task.title,
			callback: function(err,data,request) {
				if(err) {
					return callback(err);
				}
				// Store the tiddler and revision number
				self.storeTiddler(JSON.parse(data),self.getRevisionFromEtag(request));
				// Invoke the callback
				callback(null);
			}
		});
	}
};

/*
Convert a TiddlyWeb JSON tiddler into a TiddlyWiki5 tiddler and save it in the store. Returns true if the tiddler was actually stored
*/
TiddlyWebSyncer.prototype.storeTiddler = function(tiddlerFields,revision) {
	var self = this,
		result = {};
	// Transfer the fields, pulling down the `fields` hashmap
	$tw.utils.each(tiddlerFields,function(element,title,object) {
		if(title === "fields") {
			$tw.utils.each(element,function(element,subTitle,object) {
				result[subTitle] = element;
			});
		} else {
			result[title] = tiddlerFields[title];
		}
	});
	// Some unholy freaking of content types
	if(result.type === "text/javascript") {
		result.type = "application/javascript";
	} else if(!result.type || result.type === "None") {
		result.type = "text/x-tiddlywiki";
	}
	// Save the tiddler
	self.wiki.addTiddler(new $tw.Tiddler(self.wiki.getTiddler(result.title),result));
	// Save the tiddler revision and changeCount details
	self.tiddlerInfo[result.title] = {
		revision: revision,
		changeCount: self.wiki.getChangeCount(result.title)
	};
};

/*
Convert a tiddler to a field set suitable for PUTting to TiddlyWeb
*/
TiddlyWebSyncer.prototype.convertTiddlerToTiddlyWebFormat = function(title) {
	var result = {},
		tiddler = this.wiki.getTiddler(title),
		knownFields = [
			"bag", "created", "creator", "modified", "modifier", "permissions", "recipe", "revision", "tags", "text", "title", "type", "uri"
		];
	if(tiddler) {
		$tw.utils.each(tiddler.fields,function(fieldValue,fieldName) {
			var fieldString = fieldName === "tags" ?
								tiddler.fields.tags :
								tiddler.getFieldString(fieldName); // Tags must be passed as an array, not a string

			if(knownFields.indexOf(fieldName) !== -1) {
				// If it's a known field, just copy it across
				result[fieldName] = fieldString;
			} else {
				// If it's unknown, put it in the "fields" field
				result.fields = result.fields || {};
				result.fields[fieldName] = fieldString;
			}
		});
	}
	// Convert the type "text/x-tiddlywiki" into null
	if(result.type === "text/x-tiddlywiki") {
		result.type = null;
	}
	return JSON.stringify(result);
};

/*
Extract the revision from the Etag header of a request
*/
TiddlyWebSyncer.prototype.getRevisionFromEtag = function(request) {
	var etag = request.getResponseHeader("Etag");
	if(etag) {
		return etag.split("/")[2].split(":")[0]; // etags are like "system-images_public/unsyncedIcon/946151:9f11c278ccde3a3149f339f4a1db80dd4369fc04"
	} else {
		return 0;
	}
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
			$tw.utils.each(options.data,function(dataItem,dataItemTitle) {
				results.push(dataItemTitle + "=" + encodeURIComponent(dataItem));
			});
			data = results.join("&");
		}
	}
	// Set up the state change handler
	request.onreadystatechange = function() {
		if(this.readyState === 4) {
			if(this.status === 200) {
				// Success!
				options.callback(null,this.responseText,this);
				return;
			}
		// Something went wrong
		options.callback(new Error("XMLHttpRequest error: " + this.status));
		}
	};
	// Make the request
	request.open(type,options.url,true);
	if(headers) {
		$tw.utils.each(headers,function(header,headerTitle,object) {
			request.setRequestHeader(headerTitle,header);
		});
	}
	if(data && !$tw.utils.hop(headers,"Content-type")) {
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8");
	}
	request.send(data);
	return request;
};

/*
Retrieve the CSRF token from its cookie
*/
TiddlyWebSyncer.prototype.getCsrfToken = function() {
	var regex = /^(?:.*; )?csrf_token=([^(;|$)]*)(?:;|$)/,
		match = regex.exec(document.cookie),
		csrf = null;
	if (match && (match.length === 2)) {
		csrf = match[1];
	}
	return csrf;

};

// Only export anything on the browser
if($tw.browser) {
	exports.name = "tiddlywebsyncer";
	exports.syncer = TiddlyWebSyncer;
}

})();
