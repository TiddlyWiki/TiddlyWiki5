/*\
title: $:/core/modules/syncer.js
type: application/javascript
module-type: global

The syncer transfers content to and from data sources using syncadaptor modules.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Instantiate the syncer with the following options:
wiki: wiki to be synced
*/
function Syncer(options) {
	var self = this;
	this.wiki = options.wiki;
	// Make a logger
	this.log = $tw.logger.makeLog("syncer");
	// Find a working syncadaptor
	this.syncadaptor = undefined;
	$tw.modules.forEachModuleOfType("syncadaptor",function(title,module) {
		if(!self.syncadaptor && module.adaptorClass) {
			self.syncadaptor = new module.adaptorClass(self);
		}
	});
	// Only do anything if we've got a syncadaptor
	if(this.syncadaptor) {
		this.init();
	}
}

/*
Error handling
*/
Syncer.prototype.showError = function(error) {
	this.log("Error: " + error);
};

/*
Constants
*/
Syncer.prototype.titleIsLoggedIn = "$:/status/IsLoggedIn";
Syncer.prototype.titleUserName = "$:/status/UserName";
Syncer.prototype.taskTimerInterval = 1 * 1000; // Interval for sync timer
Syncer.prototype.throttleInterval = 1 * 1000; // Defer saving tiddlers if they've changed in the last 1s...
Syncer.prototype.fallbackInterval = 10 * 1000; // Unless the task is older than 10s
Syncer.prototype.pollTimerInterval = 60 * 1000; // Interval for polling for changes from the adaptor

/*
Initialise the syncer
*/
Syncer.prototype.init = function() {
	var self = this;
	// Hashmap by title of {revision:,changeCount:,adaptorInfo:}
	this.tiddlerInfo = {};
	// Record information for known tiddlers
	this.wiki.forEachTiddler({includeSystem: true},function(title,tiddler) {
		self.tiddlerInfo[title] = {
			revision: tiddler.fields["revision"],
			adaptorInfo: self.syncadaptor.getTiddlerInfo(tiddler),
			changeCount: self.wiki.getChangeCount(title)
		}
	});
	// Tasks are {type: "load"/"save"/"delete", title:, queueTime:, lastModificationTime:}
	this.taskQueue = {}; // Hashmap of tasks to be performed
	this.taskInProgress = {}; // Hash of tasks in progress
	this.taskTimerId = null; // Timer for task dispatch
	this.pollTimerId = null; // Timer for polling server
	// Listen out for changes to tiddlers
	this.wiki.addEventListener("change",function(changes) {
		self.syncToServer(changes);
	});
	// Listen out for lazyLoad events
	this.wiki.addEventListener("lazyLoad",function(title) {
		self.handleLazyLoadEvent(title);
	});
	// Listen out for login/logout/refresh events in the browser
	if($tw.browser) {
		document.addEventListener("tw-login",function(event) {
			self.handleLoginEvent(event);
		},false);
		document.addEventListener("tw-logout",function(event) {
			self.handleLogoutEvent(event);
		},false);
		document.addEventListener("tw-server-refresh",function(event) {
			self.handleRefreshEvent(event);
		},false);
	}
	// Get the login status
	this.getStatus(function (err,isLoggedIn) {
		if(isLoggedIn) {
			// Do a sync from the server
			self.syncFromServer();
		}
	});
};

/*
Save an incoming tiddler in the store, and updates the associated tiddlerInfo
*/
Syncer.prototype.storeTiddler = function(tiddlerFields) {
	// Save the tiddler
	var tiddler = new $tw.Tiddler(this.wiki.getTiddler(tiddlerFields.title),tiddlerFields);
	this.wiki.addTiddler(tiddler);
	// Save the tiddler revision and changeCount details
	this.tiddlerInfo[tiddlerFields.title] = {
		revision: tiddlerFields.revision,
		adaptorInfo: this.syncadaptor.getTiddlerInfo(tiddler),
		changeCount: this.wiki.getChangeCount(tiddlerFields.title)
	};
};

Syncer.prototype.getStatus = function(callback) {
	var self = this;
	// Check if the adaptor supports getStatus()
	if(this.syncadaptor.getStatus) {
		// Mark us as not logged in
		this.wiki.addTiddler({title: this.titleIsLoggedIn,text: "no"});
		// Get login status
		this.syncadaptor.getStatus(function(err,isLoggedIn,username) {
			if(err) {
				self.showError(err);
				return;
			}
			// Set the various status tiddlers
			self.wiki.addTiddler({title: self.titleIsLoggedIn,text: isLoggedIn ? "yes" : "no"});
			if(isLoggedIn) {
				self.wiki.addTiddler({title: self.titleUserName,text: username});
			} else {
				self.wiki.deleteTiddler(self.titleUserName);
			}
			// Invoke the callback
			if(callback) {
				callback(err,isLoggedIn,username);
			}
		});
	} else {
		callback(null,true,"UNAUTHENTICATED");
	}
};

/*
Synchronise from the server by reading the skinny tiddler list and queuing up loads for any tiddlers that we don't already have up to date
*/
Syncer.prototype.syncFromServer = function() {
	if(this.syncadaptor.getSkinnyTiddlers) {
		this.log("Retrieving skinny tiddler list");
		var self = this;
		if(this.pollTimerId) {
			clearTimeout(this.pollTimerId);
			this.pollTimerId = null;
		}
		this.syncadaptor.getSkinnyTiddlers(function(err,tiddlers) {
			// Trigger another sync
			self.pollTimerId = setTimeout(function() {
				self.pollTimerId = null;
				self.syncFromServer.call(self);
			},self.pollTimerInterval);
			// Check for errors
			if(err) {
				self.log("Error retrieving skinny tiddler list:",err);
				return;
			}
			// Process each incoming tiddler
			for(var t=0; t<tiddlers.length; t++) {
				// Get the incoming tiddler fields, and the existing tiddler
				var tiddlerFields = tiddlers[t],
					incomingRevision = tiddlerFields.revision + "",
					tiddler = self.wiki.getTiddler(tiddlerFields.title),
					tiddlerInfo = self.tiddlerInfo[tiddlerFields.title],
					currRevision = tiddlerInfo ? tiddlerInfo.revision : null;
				// Ignore the incoming tiddler if it's the same as the revision we've already got
				if(currRevision !== incomingRevision) {
					// Do a full load if we've already got a fat version of the tiddler
					if(tiddler && tiddler.fields.text !== undefined) {
						// Do a full load of this tiddler
						self.enqueueSyncTask({
							type: "load",
							title: tiddlerFields.title
						});
					} else {
						// Load the skinny version of the tiddler
						self.storeTiddler(tiddlerFields);
					}
				}
			}
		});
	}
};

/*
Synchronise a set of changes to the server
*/
Syncer.prototype.syncToServer = function(changes) {
	var self = this,
		now = new Date();
	$tw.utils.each(changes,function(change,title,object) {
		// Ignore the change if it is a shadow tiddler
		if((change.deleted && $tw.utils.hop(self.tiddlerInfo,title)) || (!change.deleted && self.wiki.tiddlerExists(title))) {
			// Queue a task to sync this tiddler
			self.enqueueSyncTask({
				type: change.deleted ? "delete" : "save",
				title: title
			});
		}
	});
};

/*
Lazily load a skinny tiddler if we can
*/
Syncer.prototype.handleLazyLoadEvent = function(title) {
	// Queue up a sync task to load this tiddler
	this.enqueueSyncTask({
		type: "load",
		title: title
	});
};

/*
Dispay a password prompt and allow the user to login
*/
Syncer.prototype.handleLoginEvent = function() {
	var self = this;
	this.getStatus(function(err,isLoggedIn,username) {
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
Syncer.prototype.login = function(username,password,callback) {
	this.log("Attempting to login as",username);
	var self = this;
	if(this.syncadaptor.login) {
		this.syncadaptor.login(username,password,function(err) {
			if(err) {
				return callback(err);
			}
			self.getStatus(function(err,isLoggedIn,username) {
				if(callback) {
					callback(null,isLoggedIn);
				}
			});
		});
	} else {
		callback(null,true);
	}
};

/*
Attempt to log out of TiddlyWeb
*/
Syncer.prototype.handleLogoutEvent = function() {
	this.log("Attempting to logout");
	var self = this;
	if(this.syncadaptor.logout) {
		this.syncadaptor.logout(function(err) {
			if(err) {
				self.showError(err);
			} else {
				self.getStatus();
			}
		});
	}
};

/*
Immediately refresh from the server
*/
Syncer.prototype.handleRefreshEvent = function() {
	this.syncFromServer();
};

/*
Queue up a sync task. If there is already a pending task for the tiddler, just update the last modification time
*/
Syncer.prototype.enqueueSyncTask = function(task) {
	var self = this,
		now = new Date();
	// Set the timestamps on this task
	task.queueTime = now;
	task.lastModificationTime = now;
	// Fill in some tiddlerInfo if the tiddler is one we haven't seen before
	if(!$tw.utils.hop(this.tiddlerInfo,task.title)) {
		this.tiddlerInfo[task.title] = {
			revision: null,
			adaptorInfo: {},
			changeCount: -1
		}
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
		// If the new task is a save then we upgrade the existing task to a save. Thus a pending load is turned into a save if the tiddler changes locally in the meantime. But a pending save is not modified to become a load
		if(task.type === "save" || task.type === "delete") {
			existingTask.type = task.type;
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
Syncer.prototype.numTasksInProgress = function() {
	return $tw.utils.count(this.taskInProgress);
};

/*
Return the number of tasks in the queue
*/
Syncer.prototype.numTasksInQueue = function() {
	return $tw.utils.count(this.taskQueue);
};

/*
Trigger a timeout if one isn't already outstanding
*/
Syncer.prototype.triggerTimeout = function() {
	var self = this;
	if(!this.taskTimerId) {
		this.taskTimerId = setTimeout(function() {
			self.taskTimerId = null;
			self.processTaskQueue.call(self);
		},self.taskTimerInterval);
	}
};

/*
Process the task queue, performing the next task if appropriate
*/
Syncer.prototype.processTaskQueue = function() {
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
				if(err) {
					self.showError("Sync error while processing '" + task.title + "':\n" + err);
				}
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
Syncer.prototype.chooseNextTask = function() {
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
		if(task.type === "save" && (now - task.lastModificationTime) < self.throttleInterval &&
			(now - task.queueTime) < self.fallbackInterval) {
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
Syncer.prototype.dispatchTask = function(task,callback) {
	var self = this;
	if(task.type === "save") {
		var changeCount = this.wiki.getChangeCount(task.title),
			tiddler = this.wiki.getTiddler(task.title);
		this.log("Dispatching 'save' task:",task.title);
		if(tiddler) {
			this.syncadaptor.saveTiddler(tiddler,function(err,adaptorInfo,revision) {
				if(err) {
					return callback(err);
				}
				// Adjust the info stored about this tiddler
				self.tiddlerInfo[task.title] = {
					changeCount: changeCount,
					adaptorInfo: adaptorInfo,
					revision: revision
				};
				// Invoke the callback
				callback(null);
			});
		}
	} else if(task.type === "load") {
		// Load the tiddler
		this.log("Dispatching 'load' task:",task.title);
		this.syncadaptor.loadTiddler(task.title,function(err,tiddlerFields) {
			if(err) {
				return callback(err);
			}
			// Store the tiddler
			if(tiddlerFields) {
				self.storeTiddler(tiddlerFields);
			}
			// Invoke the callback
			callback(null);
		});
	} else if(task.type === "delete") {
		// Delete the tiddler
		this.log("Dispatching 'delete' task:",task.title);
		this.syncadaptor.deleteTiddler(task.title,function(err) {
			if(err) {
				return callback(err);
			}
			// Invoke the callback
			callback(null);
		});
	}
};

exports.Syncer = Syncer;

})();
