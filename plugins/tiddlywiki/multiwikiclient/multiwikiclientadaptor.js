/*\
title: $:/plugins/tiddlywiki/multiwikiclient/multiwikiclientadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with MultiWikiServer-compatible servers. It has three key areas of concern:

* Basic operations like put, get, and delete a tiddler on the server
* Real time updates from the server (handled by SSE)
* Managing login/logout (not yet implemeneted)
* Bags and recipes, which are unknown to the syncer

A key aspect of the design is that the syncer never overlaps basic server operations; it waits for the
previous operation to complete before sending a new one.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CONFIG_HOST_TIDDLER = "$:/config/multiwikiclient/host",
	DEFAULT_HOST_TIDDLER = "$protocol$//$host$/",
	MWC_STATE_TIDDLER_PREFIX = "$:/state/multiwikiclient/",
	BAG_STATE_TIDDLER = "$:/state/multiwikiclient/tiddlers/bag",
	REVISION_STATE_TIDDLER = "$:/state/multiwikiclient/tiddlers/revision",
	CONNECTION_STATE_TIDDLER = "$:/state/multiwikiclient/connection",
	INCOMING_UPDATES_FILTER_TIDDLER = "$:/config/multiwikiclient/incoming-updates-filter",
	ENABLE_SSE_TIDDLER = "$:/config/multiwikiclient/use-server-sent-events";

var SERVER_NOT_CONNECTED = "NOT CONNECTED",
	SERVER_CONNECTING_SSE = "CONNECTING SSE",
	SERVER_CONNECTED_SSE  = "CONNECTED SSE",
	SERVER_POLLING = "SERVER POLLING";

function MultiWikiClientAdaptor(options) {
	this.wiki = options.wiki;
	this.host = this.getHost();
	this.recipe = this.wiki.getTiddlerText("$:/config/multiwikiclient/recipe");
	this.useServerSentEvents = this.wiki.getTiddlerText(ENABLE_SSE_TIDDLER) === "yes";
	this.last_known_tiddler_id = $tw.utils.parseNumber(this.wiki.getTiddlerText("$:/state/multiwikiclient/recipe/last_tiddler_id","0"));
	this.outstandingRequests = Object.create(null); // Hashmap by title of outstanding request object: {type: "PUT"|"GET"|"DELETE"}
	this.lastRecordedUpdate = Object.create(null); // Hashmap by title of last recorded update via SSE: {type: "update"|"detetion", tiddler_id:}
	this.logger = new $tw.utils.Logger("MultiWikiClientAdaptor");
	this.isLoggedIn = false;
	this.isReadOnly = false;
	this.logoutIsAvailable = true;
	// Compile the dirty tiddler filter
	this.incomingUpdatesFilterFn = this.wiki.compileFilter(this.wiki.getTiddlerText(INCOMING_UPDATES_FILTER_TIDDLER));
	this.setUpdateConnectionStatus(SERVER_NOT_CONNECTED);
}

MultiWikiClientAdaptor.prototype.setUpdateConnectionStatus = function(status) {
	this.serverUpdateConnectionStatus = status;
	this.wiki.addTiddler({
		title: CONNECTION_STATE_TIDDLER,
		text: status
	});
};

MultiWikiClientAdaptor.prototype.name = "multiwikiclient";

MultiWikiClientAdaptor.prototype.supportsLazyLoading = true;

MultiWikiClientAdaptor.prototype.setLoggerSaveBuffer = function(loggerForSaving) {
	this.logger.setSaveBuffer(loggerForSaving);
};

MultiWikiClientAdaptor.prototype.isReady = function() {
	return true;
};

MultiWikiClientAdaptor.prototype.getHost = function() {
	var text = this.wiki.getTiddlerText(CONFIG_HOST_TIDDLER,DEFAULT_HOST_TIDDLER),
		substitutions = [
			{name: "protocol", value: document.location.protocol},
			{name: "host", value: document.location.host},
			{name: "pathname", value: document.location.pathname}
		];
	for(var t=0; t<substitutions.length; t++) {
		var s = substitutions[t];
		text = $tw.utils.replaceString(text,new RegExp("\\$" + s.name + "\\$","mg"),s.value);
	}
	return text;
};

MultiWikiClientAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	var title = tiddler.fields.title,
		revision = this.wiki.extractTiddlerDataItem(REVISION_STATE_TIDDLER,title),
		bag = this.wiki.extractTiddlerDataItem(BAG_STATE_TIDDLER,title);
	if(revision && bag) {
		return {
			title: title,
			revision: revision,
			bag: bag
		};
	} else {
		return undefined;
	}
};

MultiWikiClientAdaptor.prototype.getTiddlerBag = function(title) {
	return this.wiki.extractTiddlerDataItem(BAG_STATE_TIDDLER,title);
};

MultiWikiClientAdaptor.prototype.getTiddlerRevision = function(title) {
	return this.wiki.extractTiddlerDataItem(REVISION_STATE_TIDDLER,title);
};

MultiWikiClientAdaptor.prototype.setTiddlerInfo = function(title,revision,bag) {
	this.wiki.setText(BAG_STATE_TIDDLER,null,title,bag,{suppressTimestamp: true});
	this.wiki.setText(REVISION_STATE_TIDDLER,null,title,revision,{suppressTimestamp: true});
};

MultiWikiClientAdaptor.prototype.removeTiddlerInfo = function(title) {
	this.wiki.setText(BAG_STATE_TIDDLER,null,title,undefined,{suppressTimestamp: true});
	this.wiki.setText(REVISION_STATE_TIDDLER,null,title,undefined,{suppressTimestamp: true});
};

/*
Get the current status of the server connection
*/
MultiWikiClientAdaptor.prototype.getStatus = function(callback) {
	// Invoke the callback if present
	if(callback) {
		callback(
			null, // Error
			true, // Is logged in
			this.username, // Username
			false, // Is read only
			true // Is anonymous
		);
	}
};

/*
Get details of changed tiddlers from the server
*/
MultiWikiClientAdaptor.prototype.getUpdatedTiddlers = function(syncer,callback) {
	if(this.useServerSentEvents) {
		var self = this;
		// Do nothing if there's already a connection in progress.
		if(this.serverUpdateConnectionStatus !== SERVER_NOT_CONNECTED) {
			return callback(null,{
				modifications: [],
				deletions: []
			});
		}
		// Try to connect a server stream
		this.setUpdateConnectionStatus(SERVER_CONNECTING_SSE);
		this.connectServerStream({
			syncer: syncer,
			onerror: function(err) {
				self.logger.log("Error connecting SSE stream",err);
				// If the stream didn't work, try polling
				self.setUpdateConnectionStatus(SERVER_POLLING);
				self.pollServer({
					callback: function(err,changes) {
						self.setUpdateConnectionStatus(SERVER_NOT_CONNECTED);
						callback(null,changes);
					}
				});
			},
			onopen: function() {
				self.setUpdateConnectionStatus(SERVER_CONNECTED_SSE);
				// The syncer is expecting a callback but we don't have any data to send
				callback(null,{
					modifications: [],
					deletions: []
				});
			}
		});
	} else {
		this.pollServer({
			callback: function(err,changes) {
				callback(null,changes);
			}
		});	
	}
};

/*
Attempt to establish an SSE stream with the server and transfer tiddler changes. Options include:

syncer: reference to syncer object used for storing data
onopen: invoked when the stream is successfully opened
onerror: invoked if there is an error
*/
MultiWikiClientAdaptor.prototype.connectServerStream = function(options) {
	var self = this;
	const eventSource = new EventSource("/recipes/" + this.recipe + "/events?last_known_tiddler_id=" + this.last_known_tiddler_id);
	eventSource.onerror = function(event) {
		if(options.onerror) {
			options.onerror(event);
		}
	}
	eventSource.onopen = function(event) {
		if(options.onopen) {
			options.onopen(event);
		}
	}
	eventSource.addEventListener("change", function(event) {
		const data = $tw.utils.parseJSONSafe(event.data);
		if(data) {
			console.log("SSE data",data)
			// Update last seen tiddler_id
			if(data.tiddler_id > self.last_known_tiddler_id) {
				self.last_known_tiddler_id = data.tiddler_id;
			}
			// Record the last update to this tiddler
			self.lastRecordedUpdate[data.title] = {
				type: data.is_deleted ? "deletion" : "update",
				tiddler_id: data.tiddler_id
			};
			console.log(`Oustanding requests is ${JSON.stringify(self.outstandingRequests[data.title])}`)
			// Process the update if the tiddler is not the subject of an outstanding request
			if(!self.outstandingRequests[data.title]) {
				if(data.is_deleted) {
					self.removeTiddlerInfo(data.title);
					delete options.syncer.tiddlerInfo[data.title];
					options.syncer.logger.log("Deleting tiddler missing from server:",data.title);
					options.syncer.wiki.deleteTiddler(data.title);
					options.syncer.processTaskQueue();
				} else {
					var result = self.incomingUpdatesFilterFn.call(self.wiki,self.wiki.makeTiddlerIterator([data.title]));
					if(result.length > 0) {
						self.setTiddlerInfo(data.title,data.tiddler_id.toString(),data.bag_name);
						options.syncer.storeTiddler(data.tiddler);	
					}
				}	
			}
		}
	});
};

/*
Poll the server for changes. Options include:

callback: invoked on completion as (err,changes)
*/
MultiWikiClientAdaptor.prototype.pollServer = function(options) {
	var self = this;
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + this.recipe + "/tiddlers.json",
		data: {
			last_known_tiddler_id: this.last_known_tiddler_id,
			include_deleted: "true"
		},
		callback: function(err,data) {
			// Check for errors
			if(err) {
				return options.callback(err);
			}
			var modifications = [],
				deletions = [];
			var tiddlerInfoArray = $tw.utils.parseJSONSafe(data);
			$tw.utils.each(tiddlerInfoArray,function(tiddlerInfo) {
				if(tiddlerInfo.tiddler_id > self.last_known_tiddler_id) {
					self.last_known_tiddler_id = tiddlerInfo.tiddler_id;
				}
				if(tiddlerInfo.is_deleted) {
					deletions.push(tiddlerInfo.title);
				} else {
					modifications.push(tiddlerInfo.title);
				}
			});
			// Invoke the callback with the results
			options.callback(null,{
				modifications: modifications,
				deletions: deletions
			});
			// If Browswer Storage tiddlers were cached on reloading the wiki, add them after sync from server completes in the above callback.
			if($tw.browserStorage && $tw.browserStorage.isEnabled()) { 
				$tw.browserStorage.addCachedTiddlers();
			}
		}
	});
};

/*
Queue a load for a tiddler if there has been an update for it since the specified revision
*/
MultiWikiClientAdaptor.prototype.checkLastRecordedUpdate = function(title,revision,syncer) {
	var lru = this.lastRecordedUpdate[title];
	if(lru) {
		var numRevision = $tw.utils.getInt(revision);
		console.log(`Checking for updates to ${title} since ${JSON.stringify(revision)} comparing to ${numRevision}`)
		if(lru.tiddler_id > numRevision) {
			syncer.enqueueLoadTiddler(title);
		}
	}
}

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
MultiWikiClientAdaptor.prototype.saveTiddler = function(tiddler,callback,options) {
	var self = this,
		title = tiddler.fields.title;
	if(this.isReadOnly || title.substr(0,MWC_STATE_TIDDLER_PREFIX.length) === MWC_STATE_TIDDLER_PREFIX) {
		return callback(null);
	}
	self.outstandingRequests[title] = {type: "PUT"};
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + encodeURIComponent(this.recipe) + "/tiddlers/" + encodeURIComponent(title),
		type: "PUT",
		headers: {
			"Content-type": "application/json"
		},
		data: JSON.stringify(tiddler.getFieldStrings()),
		callback: function(err,data,request) {
			delete self.outstandingRequests[title];
			if(err) {
				return callback(err);
			}
			//If Browser-Storage plugin is present, remove tiddler from local storage after successful sync to the server
			if($tw.browserStorage && $tw.browserStorage.isEnabled()) {
				$tw.browserStorage.removeTiddlerFromLocalStorage(title)
			}
			// Save the details of the new revision of the tiddler
			var revision = request.getResponseHeader("X-Revision-Number"),
				bag_name = request.getResponseHeader("X-Bag-Name");
console.log(`Saved ${title} with revision ${revision} and bag ${bag_name}`)
			// If there has been a more recent update from the server then enqueue a load of this tiddler
			self.checkLastRecordedUpdate(title,revision,options.syncer);
			// Invoke the callback
			self.setTiddlerInfo(title,revision,bag_name);
			callback(null,{bag: bag_name},revision);
		}
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
MultiWikiClientAdaptor.prototype.loadTiddler = function(title,callback,options) {
	var self = this;
	self.outstandingRequests[title] = {type: "GET"};
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + encodeURIComponent(this.recipe) + "/tiddlers/" + encodeURIComponent(title),
		callback: function(err,data,request) {
			delete self.outstandingRequests[title];
			if(err === 404) {
				return callback(null,null);
			} else if(err) {
				return callback(err);
			}
			var revision = request.getResponseHeader("X-Revision-Number"),
				bag_name = request.getResponseHeader("X-Bag-Name");
			// If there has been a more recent update from the server then enqueue a load of this tiddler
			self.checkLastRecordedUpdate(title,revision,options.syncer);
			// Invoke the callback
			self.setTiddlerInfo(title,revision,bag_name);
			callback(null,$tw.utils.parseJSONSafe(data));
		}
	});
};

/*
Delete a tiddler and invoke the callback with (err)
options include:
tiddlerInfo: the syncer's tiddlerInfo for this tiddler
*/
MultiWikiClientAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this;
	if(this.isReadOnly) {
		return callback(null);
	}
	// If we don't have a bag it means that the tiddler hasn't been seen by the server, so we don't need to delete it
	var bag = this.getTiddlerBag(title);
	if(!bag) {
		return callback(null,options.tiddlerInfo.adaptorInfo);
	}
	self.outstandingRequests[title] = {type: "DELETE"};
	// Issue HTTP request to delete the tiddler
	$tw.utils.httpRequest({
		url: this.host + "bags/" + encodeURIComponent(bag) + "/tiddlers/" + encodeURIComponent(title),
		type: "DELETE",
		callback: function(err,data,request) {
			delete self.outstandingRequests[title];
			if(err) {
				return callback(err);
			}
			var revision = request.getResponseHeader("X-Revision-Number");
			// If there has been a more recent update from the server then enqueue a load of this tiddler
			self.checkLastRecordedUpdate(title,revision,options.syncer);
			self.removeTiddlerInfo(title);
			// Invoke the callback & return null adaptorInfo
			callback(null,null);
		}
	});
};

if($tw.browser && document.location.protocol.substr(0,4) === "http" ) {
	exports.adaptorClass = MultiWikiClientAdaptor;
}

})();
