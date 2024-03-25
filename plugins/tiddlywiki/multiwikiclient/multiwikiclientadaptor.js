/*\
title: $:/plugins/tiddlywiki/multiwikiclient/multiwikiclientadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with MultiWikiServer-compatible servers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CONFIG_HOST_TIDDLER = "$:/config/multiwikiclient/host",
	DEFAULT_HOST_TIDDLER = "$protocol$//$host$/",
	BAG_STATE_TIDDLER = "$:/state/multiwikiclient/tiddlers/bag",
	REVISION_STATE_TIDDLER = "$:/state/multiwikiclient/tiddlers/revision",
	CONNECTION_STATE_TIDDLER = "$:/state/multiwikiclient/connection";

var SERVER_NOT_CONNECTED = "NOT CONNECTED",
	SERVER_CONNECTING_SSE = "CONNECTING SSE",
	SERVER_CONNECTED_SSE  = "CONNECTED SSE",
	SERVER_POLLING = "SERVER POLLING";

function MultiWikiClientAdaptor(options) {
	this.wiki = options.wiki;
	this.host = this.getHost();
	this.recipe = this.wiki.getTiddlerText("$:/config/multiwikiclient/recipe");
	this.last_known_tiddler_id = $tw.utils.parseNumber(this.wiki.getTiddlerText("$:/state/multiwikiclient/recipe/last_tiddler_id","0"));
	this.logger = new $tw.utils.Logger("MultiWikiClientAdaptor");
	this.isLoggedIn = false;
	this.isReadOnly = false;
	this.logoutIsAvailable = true;
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
			if(data.is_deleted) {
				if(data.tiddler_id > self.last_known_tiddler_id) {
					self.last_known_tiddler_id = data.tiddler_id;
				}
				self.removeTiddlerInfo(data.title);
				delete options.syncer.tiddlerInfo[data.title];
				options.syncer.logger.log("Deleting tiddler missing from server:",data.title);
				options.syncer.wiki.deleteTiddler(data.title);
				options.syncer.processTaskQueue();
			} else {
				self.setTiddlerInfo(data.title,data.tiddler_id,data.bag_name);
				options.syncer.storeTiddler(data.tiddler);
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
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
MultiWikiClientAdaptor.prototype.saveTiddler = function(tiddler,callback,options) {
	var self = this;
	if(this.isReadOnly) {
		return callback(null);
	}
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + encodeURIComponent(this.recipe) + "/tiddlers/" + encodeURIComponent(tiddler.fields.title),
		type: "PUT",
		headers: {
			"Content-type": "application/json"
		},
		data: JSON.stringify(tiddler.getFieldStrings()),
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			//If Browser-Storage plugin is present, remove tiddler from local storage after successful sync to the server
			if($tw.browserStorage && $tw.browserStorage.isEnabled()) {
				$tw.browserStorage.removeTiddlerFromLocalStorage(tiddler.fields.title)
			}
			// Save the details of the new revision of the tiddler
			var revision = request.getResponseHeader("X-Revision-Number"),
				bag_name = request.getResponseHeader("X-Bag-Name");
console.log(`Saved ${tiddler.fields.title} with revision ${revision} and bag ${bag_name}`)
			// Invoke the callback
			self.setTiddlerInfo(tiddler.fields.title,revision,bag_name);
			callback(null,{bag: bag_name},revision);
		}
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
MultiWikiClientAdaptor.prototype.loadTiddler = function(title,callback) {
	var self = this;
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + encodeURIComponent(this.recipe) + "/tiddlers/" + encodeURIComponent(title),
		callback: function(err,data,request) {
			if(err === 404) {
				return callback(null,null);
			} else if(err) {
				return callback(err);
			}
			// Invoke the callback
			var revision = request.getResponseHeader("X-Revision-Number"),
				bag_name = request.getResponseHeader("X-Bag-Name");
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
	// Issue HTTP request to delete the tiddler
	$tw.utils.httpRequest({
		url: this.host + "bags/" + encodeURIComponent(bag) + "/tiddlers/" + encodeURIComponent(title),
		type: "DELETE",
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
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
