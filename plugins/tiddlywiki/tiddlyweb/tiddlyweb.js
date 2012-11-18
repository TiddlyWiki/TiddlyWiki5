/*\
title: $:/plugins/tiddlywiki/tiddlyweb/tiddlyweb.js
type: application/javascript
module-type: syncer

Main TiddlyWeb integration module

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
	// Check if we've already got a connection
	if(this.connection) {
		return Error("TiddlyWebSyncer can only handle a single connection");
	}
	// Check the connection has its constituent parts
	if(!connection.host || !connection.recipe) {
		return Error("Missing connection data")
	}
	// Mark us as not logged in
	$tw.wiki.addTiddler({title: TiddlyWebSyncer.titleIsLoggedIn,text: "no"});
	// Save and return the connection object
	this.connection = connection;
	// Get the login status
	var self = this;
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
				$tw.wiki.addTiddler({title: TiddlyWebSyncer.titleIsLoggedIn,text: isLoggedIn ? "yes" : "no"});
				if(isLoggedIn) {
					$tw.wiki.addTiddler({title: TiddlyWebSyncer.titleUserName,text: json.username});
				} else {
					$tw.wiki.deleteTiddler(TiddlyWebSyncer.titleUserName);
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
Convert a TiddlyWeb JSON tiddler into a TiddlyWiki5 tiddler
*/
TiddlyWebSyncer.prototype.convertTiddler = function(tiddlerFields) {
	var result = {};
	for(var f in tiddlerFields) {
		switch(f) {
			case "fields":
				for(var ff in tiddlerFields[f]) {
					result[ff] = tiddlerFields[f][ff];
				}
				break;
			default:
				result[f] = tiddlerFields[f];
				break;
		}
	}
	return result;
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
				self.wiki.addTiddler(new $tw.Tiddler(self.convertTiddler(json[t])));
			}
		}
	});
};

/*
Lazily load a skinny tiddler if we can
*/
TiddlyWebSyncer.prototype.lazyLoad = function(connection,title,tiddler) {
	var self = this;
	this.httpRequest({
		url: this.connection.host + "recipes/" + this.connection.recipe + "/tiddlers/" + title,
		callback: function(err,data) {
			if(err) {
console.log("error in lazyLoad",err);
				return;
			}
			self.wiki.addTiddler(new $tw.Tiddler(self.convertTiddler(JSON.parse(data))));
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
		client = new XMLHttpRequest(),
		data = "",
		f,results;
	// Massage the data hashmap into a string
	if(options.data) {
		if(typeof options.data === "string") { // Already a string
			data = options.data;
		} else { // A hashmap of strings
			results = [];
			for(f in options.data) {
				if($tw.utils.hop(options.data,f)) {
					results.push(f + "=" + encodeURIComponent(options.data[f]))
				}
			}
			data = results.join("&")
		}
	}
	// Set up the state change handler
	client.onreadystatechange = function() {
		if(this.readyState === 4) {
			if(this.status === 200) {
				// success!
				options.callback(null,this.responseText);
				return;
			}
		// something went wrong
		options.callback(new Error("XMLHttpRequest error: " + this.status));
		}
	};
	// Make the request
	client.open(type,options.url,true);
	if(headers) {
		for(var h in headers) {
			client.setRequestHeader(h,headers[h]);
		}
	}
	if(data) {
		client.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8");
	}
	client.send(data);
	return client;
};

// Only export anything on the browser
if($tw.browser) {
	exports.name = "tiddlywebsyncer";
	exports.syncer = TiddlyWebSyncer;
}

})();
