/*\
title: $:/core/modules/syncer.js
type: application/javascript
module-type: global

The syncer tracks changes to the store and synchronises them to a remote data store represented as a "sync adaptor"

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Defaults
*/
Syncer.prototype.titleIsLoggedIn = "$:/status/IsLoggedIn";
Syncer.prototype.titleIsAnonymous = "$:/status/IsAnonymous";
Syncer.prototype.titleIsReadOnly = "$:/status/IsReadOnly";
Syncer.prototype.titleUserName = "$:/status/UserName";
Syncer.prototype.titleSyncFilter = "$:/config/SyncFilter";
Syncer.prototype.titleSyncPollingInterval = "$:/config/SyncPollingInterval";
Syncer.prototype.titleSyncDisableLazyLoading = "$:/config/SyncDisableLazyLoading";
Syncer.prototype.titleSavedNotification = "$:/language/Notifications/Save/Done";
Syncer.prototype.titleSyncThrottleInterval = "$:/config/SyncThrottleInterval";
Syncer.prototype.taskTimerInterval = 1 * 1000; // Interval for sync timer
Syncer.prototype.throttleInterval = 1 * 1000; // Defer saving tiddlers if they've changed in the last 1s...
Syncer.prototype.errorRetryInterval = 5 * 1000; // Interval to retry after an error
Syncer.prototype.fallbackInterval = 10 * 1000; // Unless the task is older than 10s
Syncer.prototype.pollTimerInterval = 60 * 1000; // Interval for polling for changes from the adaptor

/*
Instantiate the syncer with the following options:
syncadaptor: reference to syncadaptor to be used
wiki: wiki to be synced
*/
function Syncer(options) {
	var self = this;
	this.wiki = options.wiki;
	// Save parameters
	this.syncadaptor = options.syncadaptor;
	this.disableUI = !!options.disableUI;
	this.titleIsLoggedIn = options.titleIsLoggedIn || this.titleIsLoggedIn;
	this.titleUserName = options.titleUserName || this.titleUserName;
	this.titleSyncFilter = options.titleSyncFilter || this.titleSyncFilter;
	this.titleSavedNotification = options.titleSavedNotification || this.titleSavedNotification;
	this.taskTimerInterval = options.taskTimerInterval || this.taskTimerInterval;
	this.throttleInterval = options.throttleInterval || parseInt(this.wiki.getTiddlerText(this.titleSyncThrottleInterval,""),10) || this.throttleInterval;
	this.errorRetryInterval = options.errorRetryInterval || this.errorRetryInterval;
	this.fallbackInterval = options.fallbackInterval || this.fallbackInterval;
	this.pollTimerInterval = options.pollTimerInterval || parseInt(this.wiki.getTiddlerText(this.titleSyncPollingInterval,""),10) || this.pollTimerInterval;
	this.logging = "logging" in options ? options.logging : true;
	// Make a logger
	this.logger = new $tw.utils.Logger("syncer" + ($tw.browser ? "-browser" : "") + ($tw.node ? "-server" : "")  + (this.syncadaptor.name ? ("-" + this.syncadaptor.name) : ""),{
		colour: "cyan",
		enable: this.logging,
		saveHistory: true
	});
	// Make another logger for connection errors
	this.loggerConnection = new $tw.utils.Logger("syncer" + ($tw.browser ? "-browser" : "") + ($tw.node ? "-server" : "")  + (this.syncadaptor.name ? ("-" + this.syncadaptor.name) : "") + "-connection",{
		colour: "cyan",
		enable: this.logging
	});
	// Ask the syncadaptor to use the main logger
	if(this.syncadaptor.setLoggerSaveBuffer) {
		this.syncadaptor.setLoggerSaveBuffer(this.logger);
	}
	// Compile the dirty tiddler filter
	this.filterFn = this.wiki.compileFilter(this.wiki.getTiddlerText(this.titleSyncFilter));
	// Record information for known tiddlers
	this.readTiddlerInfo();
	this.titlesToBeLoaded = {}; // Hashmap of titles of tiddlers that need loading from the server
	this.titlesHaveBeenLazyLoaded = {}; // Hashmap of titles of tiddlers that have already been lazily loaded from the server
	// Timers
	this.taskTimerId = null; // Timer for task dispatch
	this.pollTimerId = null; // Timer for polling server
	// Number of outstanding requests
	this.numTasksInProgress = 0;
	// Listen out for changes to tiddlers
	this.wiki.addEventListener("change",function(changes) {
		// Filter the changes to just include ones that are being synced
		var filteredChanges = self.getSyncedTiddlers(function(callback) {
			$tw.utils.each(changes,function(change,title) {
				var tiddler = self.wiki.tiddlerExists(title) && self.wiki.getTiddler(title);
				callback(tiddler,title);
			});
		});
		if(filteredChanges.length > 0) {
			self.processTaskQueue();
		} else {
			// Look for deletions of tiddlers we're already syncing	
			var outstandingDeletion = false
			$tw.utils.each(changes,function(change,title,object) {
				if(change.deleted && $tw.utils.hop(self.tiddlerInfo,title)) {
					outstandingDeletion = true;
				}
			});
			if(outstandingDeletion) {
				self.processTaskQueue();
			}
		}
	});
	// Browser event handlers
	if($tw.browser && !this.disableUI) {
		// Set up our beforeunload handler
		$tw.addUnloadTask(function(event) {
			var confirmationMessage;
			if(self.isDirty()) {
				confirmationMessage = $tw.language.getString("UnsavedChangesWarning");
				event.returnValue = confirmationMessage; // Gecko
			}
			return confirmationMessage;
		});
		// Listen out for login/logout/refresh events in the browser
		$tw.rootWidget.addEventListener("tm-login",function(event) {
			var username = event && event.paramObject && event.paramObject.username,
				password = event && event.paramObject && event.paramObject.password;
			if(username && password) {
				// Login with username and password
				self.login(username,password,function() {});
			} else {
				// No username and password, so we display a prompt
				self.handleLoginEvent();				
			}
		});
		$tw.rootWidget.addEventListener("tm-logout",function() {
			self.handleLogoutEvent();
		});
		$tw.rootWidget.addEventListener("tm-server-refresh",function() {
			self.handleRefreshEvent();
		});
		$tw.rootWidget.addEventListener("tm-copy-syncer-logs-to-clipboard",function() {
			$tw.utils.copyToClipboard($tw.utils.getSystemInfo() + "\n\nLog:\n" + self.logger.getBuffer());
		});
	}
	// Listen out for lazyLoad events
	if(!this.disableUI && this.wiki.getTiddlerText(this.titleSyncDisableLazyLoading) !== "yes") {
		this.wiki.addEventListener("lazyLoad",function(title) {
			self.handleLazyLoadEvent(title);
		});		
	}
	// Get the login status
	this.getStatus(function(err,isLoggedIn) {
		// Do a sync from the server
		self.syncFromServer();
	});
}

/*
Show a generic network error alert
*/
Syncer.prototype.displayError = function(msg,err) {
	if(err === ($tw.language.getString("Error/XMLHttpRequest") + ": 0")) {
		this.loggerConnection.alert($tw.language.getString("Error/NetworkErrorAlert"));
		this.logger.log(msg + ":",err);
	} else {
		this.logger.alert(msg + ":",err);
	}
};

/*
Return an array of the tiddler titles that are subjected to syncing
*/
Syncer.prototype.getSyncedTiddlers = function(source) {
	return this.filterFn.call(this.wiki,source);
};

/*
Return an array of the tiddler titles that are subjected to syncing
*/
Syncer.prototype.getTiddlerRevision = function(title) {
	if(this.syncadaptor && this.syncadaptor.getTiddlerRevision) {
		return this.syncadaptor.getTiddlerRevision(title);
	} else {
		return this.wiki.getTiddler(title).fields.revision;	
	} 
};

/*
Read (or re-read) the latest tiddler info from the store
*/
Syncer.prototype.readTiddlerInfo = function() {
	// Hashmap by title of {revision:,changeCount:,adaptorInfo:}
	// "revision" is the revision of the tiddler last seen on the server, and "changecount" is the corresponding local changecount
	this.tiddlerInfo = {};
	// Record information for known tiddlers
	var self = this,
		tiddlers = this.getSyncedTiddlers();
	$tw.utils.each(tiddlers,function(title) {
		var tiddler = self.wiki.getTiddler(title);
		if(tiddler) {
			self.tiddlerInfo[title] = {
				revision: self.getTiddlerRevision(title),
				adaptorInfo: self.syncadaptor && self.syncadaptor.getTiddlerInfo(tiddler),
				changeCount: self.wiki.getChangeCount(title)
			};
		}
	});
};

/*
Checks whether the wiki is dirty (ie the window shouldn't be closed)
*/
Syncer.prototype.isDirty = function() {
	this.logger.log("Checking dirty status");
	// Check tiddlers that are in the store and included in the filter function
	var titles = this.getSyncedTiddlers();
	for(var index=0; index<titles.length; index++) {
		var title = titles[index],
			tiddlerInfo = this.tiddlerInfo[title];
		if(this.wiki.tiddlerExists(title)) {
			if(tiddlerInfo) {
				// If the tiddler is known on the server and has been modified locally then it needs to be saved to the server
				if(this.wiki.getChangeCount(title) > tiddlerInfo.changeCount) {
					return true;
				}
			} else {
				// If the tiddler isn't known on the server then it needs to be saved to the server
				return true;
			}
		}
	}
	// Check tiddlers that are known from the server but not currently in the store
	titles = Object.keys(this.tiddlerInfo);
	for(index=0; index<titles.length; index++) {
		if(!this.wiki.tiddlerExists(titles[index])) {
			// There must be a pending delete
			return true;
		}
	}
	return false;
};

/*
Update the document body with the class "tc-dirty" if the wiki has unsaved/unsynced changes
*/
Syncer.prototype.updateDirtyStatus = function() {
	if($tw.browser && !this.disableUI) {
		var dirty = this.isDirty();
		$tw.utils.toggleClass(document.body,"tc-dirty",dirty);
		if(!dirty) {
			this.loggerConnection.clearAlerts();
		}
	}
};

/*
Save an incoming tiddler in the store, and updates the associated tiddlerInfo
*/
Syncer.prototype.storeTiddler = function(tiddlerFields) {
	// Save the tiddler
	var tiddler = new $tw.Tiddler(tiddlerFields);
	this.wiki.addTiddler(tiddler);
	// Save the tiddler revision and changeCount details
	this.tiddlerInfo[tiddlerFields.title] = {
		revision: this.getTiddlerRevision(tiddlerFields.title),
		adaptorInfo: this.syncadaptor.getTiddlerInfo(tiddler),
		changeCount: this.wiki.getChangeCount(tiddlerFields.title)
	};
};

Syncer.prototype.getStatus = function(callback) {
	var self = this;
	// Check if the adaptor supports getStatus()
	if(this.syncadaptor && this.syncadaptor.getStatus) {
		// Mark us as not logged in
		this.wiki.addTiddler({title: this.titleIsLoggedIn,text: "no"});
		// Get login status
		this.syncadaptor.getStatus(function(err,isLoggedIn,username,isReadOnly,isAnonymous) {
			if(err) {
				self.displayError("Get Status Error",err);
			} else {
				// Set the various status tiddlers
				self.wiki.addTiddler({title: self.titleIsReadOnly,text: isReadOnly ? "yes" : "no"});
				self.wiki.addTiddler({title: self.titleIsAnonymous,text: isAnonymous ? "yes" : "no"});
				self.wiki.addTiddler({title: self.titleIsLoggedIn,text: isLoggedIn ? "yes" : "no"});
				if(isLoggedIn) {
					self.wiki.addTiddler({title: self.titleUserName,text: username || ""});
				}
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
	var self = this,
		cancelNextSync = function() {
			if(self.pollTimerId) {
				clearTimeout(self.pollTimerId);
				self.pollTimerId = null;
			}
		},
		triggerNextSync = function() {
			self.pollTimerId = setTimeout(function() {
				self.pollTimerId = null;
				self.syncFromServer.call(self);
			},self.pollTimerInterval);
		},
		syncSystemFromServer = (self.wiki.getTiddlerText("$:/config/SyncSystemTiddlersFromServer") === "yes" ? true : false);
	if(this.syncadaptor && this.syncadaptor.getUpdatedTiddlers) {
		this.logger.log("Retrieving updated tiddler list");
		cancelNextSync();
		this.syncadaptor.getUpdatedTiddlers(self,function(err,updates) {
			triggerNextSync();
			if(err) {
				self.displayError($tw.language.getString("Error/RetrievingSkinny"),err);
				return;
			}
			if(updates) {
				$tw.utils.each(updates.modifications,function(title) {
					self.titlesToBeLoaded[title] = true;
				});
				$tw.utils.each(updates.deletions,function(title) {
					if(syncSystemFromServer || !self.wiki.isSystemTiddler(title)) {
						delete self.tiddlerInfo[title];
						self.logger.log("Deleting tiddler missing from server:",title);
						self.wiki.deleteTiddler(title);
					}
				});
				if(updates.modifications.length > 0 || updates.deletions.length > 0) {
					self.processTaskQueue();
				}				
			}
		});
	} else if(this.syncadaptor && this.syncadaptor.getSkinnyTiddlers) {
		this.logger.log("Retrieving skinny tiddler list");
		cancelNextSync();
		this.syncadaptor.getSkinnyTiddlers(function(err,tiddlers) {
			triggerNextSync();
			// Check for errors
			if(err) {
				self.displayError($tw.language.getString("Error/RetrievingSkinny"),err);
				return;
			}
			// Keep track of which tiddlers we already know about have been reported this time
			var previousTitles = Object.keys(self.tiddlerInfo);
			// Process each incoming tiddler
			for(var t=0; t<tiddlers.length; t++) {
				// Get the incoming tiddler fields, and the existing tiddler
				var tiddlerFields = tiddlers[t],
					incomingRevision = tiddlerFields.revision + "",
					tiddler = self.wiki.tiddlerExists(tiddlerFields.title) && self.wiki.getTiddler(tiddlerFields.title),
					tiddlerInfo = self.tiddlerInfo[tiddlerFields.title],
					currRevision = tiddlerInfo ? tiddlerInfo.revision : null,
					indexInPreviousTitles = previousTitles.indexOf(tiddlerFields.title);
				if(indexInPreviousTitles !== -1) {
					previousTitles.splice(indexInPreviousTitles,1);
				}
				// Ignore the incoming tiddler if it's the same as the revision we've already got
				if(currRevision !== incomingRevision) {
					// Only load the skinny version if we don't already have a fat version of the tiddler
					if(!tiddler || tiddler.fields.text === undefined) {
						self.storeTiddler(tiddlerFields);
					}
					// Do a full load of this tiddler
					self.titlesToBeLoaded[tiddlerFields.title] = true;
				}
			}
			// Delete any tiddlers that were previously reported but missing this time
			$tw.utils.each(previousTitles,function(title) {
				if(syncSystemFromServer || !self.wiki.isSystemTiddler(title)) {
					delete self.tiddlerInfo[title];
					self.logger.log("Deleting tiddler missing from server:",title);
					self.wiki.deleteTiddler(title);
				}
			});
			self.processTaskQueue();
		});
	}
};

/*
Force load a tiddler from the server
*/
Syncer.prototype.enqueueLoadTiddler = function(title) {
	this.titlesToBeLoaded[title] = true;
	this.processTaskQueue();
};

/*
Lazily load a skinny tiddler if we can
*/
Syncer.prototype.handleLazyLoadEvent = function(title) {
	// Ignore if the syncadaptor doesn't handle it
	if(!this.syncadaptor.supportsLazyLoading) {
		return;
	}
	// Don't lazy load the same tiddler twice
	if(!this.titlesHaveBeenLazyLoaded[title]) {
		// Don't lazy load if the tiddler isn't included in the sync filter
		if(this.getSyncedTiddlers().indexOf(title) !== -1) {
			// Mark the tiddler as needing loading, and having already been lazily loaded
			this.titlesToBeLoaded[title] = true;
			this.titlesHaveBeenLazyLoaded[title] = true;
		}
	}
};

/*
Dispay a password prompt and allow the user to login
*/
Syncer.prototype.handleLoginEvent = function() {
	var self = this;
	this.getStatus(function(err,isLoggedIn,username) {
		if(!err && !isLoggedIn) {
			if(self.syncadaptor && self.syncadaptor.displayLoginPrompt) {
				self.syncadaptor.displayLoginPrompt(self);
			} else {
				self.displayLoginPrompt();
			}
		}
	});
};

/*
Dispay a password prompt
*/
Syncer.prototype.displayLoginPrompt = function() {
	var self = this;
	var promptInfo = $tw.passwordPrompt.createPrompt({
		serviceName: $tw.language.getString("LoginToTiddlySpace"),
		callback: function(data) {
			self.login(data.username,data.password,function(err,isLoggedIn) {
				self.syncFromServer();
			});
			return true; // Get rid of the password prompt
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
	this.logger.log("Attempting to login as",username);
	var self = this;
	if(this.syncadaptor.login) {
		this.syncadaptor.login(username,password,function(err) {
			if(err) {
				return callback(err);
			}
			self.getStatus(function(err,isLoggedIn,username) {
				if(callback) {
					callback(err,isLoggedIn);
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
	this.logger.log("Attempting to logout");
	var self = this;
	if(this.syncadaptor.logout) {
		this.syncadaptor.logout(function(err) {
			if(err) {
				self.displayError("Logout Error",err);
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
Process the next task
*/
Syncer.prototype.processTaskQueue = function() {
	var self = this;
	// Only process a task if the sync adaptor is fully initialised and we're not already performing
	// a task. If we are already performing a task then we'll dispatch the next one when it completes
	if((!this.syncadaptor.isReady || this.syncadaptor.isReady()) && this.numTasksInProgress === 0) {
		// Choose the next task to perform
		var task = this.chooseNextTask();
		// Perform the task if we had one
		if(typeof task === "object" && task !== null) {
			this.numTasksInProgress += 1;
			task.run(function(err) {
				self.numTasksInProgress -= 1;
				if(err) {
					self.displayError("Sync error while processing " + task.type + " of '" + task.title + "'",err);
					self.updateDirtyStatus();
					self.triggerTimeout(self.errorRetryInterval);
				} else {
					self.updateDirtyStatus();
					// Process the next task
					self.processTaskQueue.call(self);					
				}
			});
		} else {
			// No task is ready so update the status
			this.updateDirtyStatus();
			// And trigger a timeout if there is a pending task
			if(task === true) {
				this.triggerTimeout();				
			}
		}
	} else {
		this.updateDirtyStatus();		
	}
};

Syncer.prototype.triggerTimeout = function(interval) {
	var self = this;
	if(!this.taskTimerId) {
		this.taskTimerId = setTimeout(function() {
			self.taskTimerId = null;
			self.processTaskQueue.call(self);
		},interval || self.taskTimerInterval);
	}
};

/*
Choose the next sync task. We prioritise saves, then deletes, then loads from the server

Returns either a task object, null if there's no upcoming tasks, or the boolean true if there are pending tasks that aren't yet due
*/
Syncer.prototype.chooseNextTask = function() {
	var thresholdLastSaved = (new Date()) - this.throttleInterval,
		havePending = null;
	// First we look for tiddlers that have been modified locally and need saving back to the server
	var titles = this.getSyncedTiddlers();
	for(var index=0; index<titles.length; index++) {
		var title = titles[index],
			tiddler = this.wiki.tiddlerExists(title) && this.wiki.getTiddler(title),
			tiddlerInfo = this.tiddlerInfo[title];
		if(tiddler) {
			// If the tiddler is not known on the server, or has been modified locally no more recently than the threshold then it needs to be saved to the server
			var hasChanged = !tiddlerInfo || this.wiki.getChangeCount(title) > tiddlerInfo.changeCount,
				isReadyToSave = !tiddlerInfo || !tiddlerInfo.timestampLastSaved || tiddlerInfo.timestampLastSaved < thresholdLastSaved;
			if(hasChanged) {
				if(isReadyToSave) {
					return new SaveTiddlerTask(this,title); 					
				} else {
					havePending = true;
				}
			}
		}
	}
	// Second, we check tiddlers that are known from the server but not currently in the store, and so need deleting on the server
	titles = Object.keys(this.tiddlerInfo);
	for(index=0; index<titles.length; index++) {
		title = titles[index];
		tiddlerInfo = this.tiddlerInfo[title];
		tiddler = this.wiki.tiddlerExists(title) && this.wiki.getTiddler(title);
		if(!tiddler) {
			return new DeleteTiddlerTask(this,title);
		}
	}
	// Check for tiddlers that need loading
	title = Object.keys(this.titlesToBeLoaded)[0];
	if(title) {
		delete this.titlesToBeLoaded[title];
		return new LoadTiddlerTask(this,title);
	}
	// No tasks are ready
	return havePending;
};

function SaveTiddlerTask(syncer,title) {
	this.syncer = syncer;
	this.title = title;
	this.type = "save";
}

SaveTiddlerTask.prototype.run = function(callback) {
	var self = this,
		changeCount = this.syncer.wiki.getChangeCount(this.title),
		tiddler = this.syncer.wiki.tiddlerExists(this.title) && this.syncer.wiki.getTiddler(this.title);
	this.syncer.logger.log("Dispatching 'save' task:",this.title);
	if(tiddler) {
		this.syncer.syncadaptor.saveTiddler(tiddler,function(err,adaptorInfo,revision) {
			// If there's an error, exit without changing any internal state
			if(err) {
				return callback(err);
			}
			// Adjust the info stored about this tiddler
			self.syncer.tiddlerInfo[self.title] = {
				changeCount: changeCount,
				adaptorInfo: adaptorInfo,
				revision: revision,
				timestampLastSaved: new Date()
			};
			// Invoke the callback
			callback(null);
		},{
			tiddlerInfo: self.syncer.tiddlerInfo[self.title]
		});
	} else {
		this.syncer.logger.log(" Not Dispatching 'save' task:",this.title,"tiddler does not exist");
		$tw.utils.nextTick(callback(null));
	}
};

function DeleteTiddlerTask(syncer,title) {
	this.syncer = syncer;
	this.title = title;
	this.type = "delete";
}

DeleteTiddlerTask.prototype.run = function(callback) {
	var self = this;
	this.syncer.logger.log("Dispatching 'delete' task:",this.title);
	this.syncer.syncadaptor.deleteTiddler(this.title,function(err) {
		// If there's an error, exit without changing any internal state
		if(err) {
			return callback(err);
		}
		// Remove the info stored about this tiddler
		delete self.syncer.tiddlerInfo[self.title];
		// Invoke the callback
		callback(null);
	},{
		tiddlerInfo: self.syncer.tiddlerInfo[this.title]
	});
};

function LoadTiddlerTask(syncer,title) {
	this.syncer = syncer;
	this.title = title;
	this.type = "load";
}

LoadTiddlerTask.prototype.run = function(callback) {
	var self = this;
	this.syncer.logger.log("Dispatching 'load' task:",this.title);
	this.syncer.syncadaptor.loadTiddler(this.title,function(err,tiddlerFields) {
		// If there's an error, exit without changing any internal state
		if(err) {
			return callback(err);
		}
		// Update the info stored about this tiddler
		if(tiddlerFields) {
			self.syncer.storeTiddler(tiddlerFields);
		}
		// Invoke the callback
		callback(null);
	});
};

exports.Syncer = Syncer;

})();
