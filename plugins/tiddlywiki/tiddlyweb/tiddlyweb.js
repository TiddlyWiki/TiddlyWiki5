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
	// Mark us as not logged in
	$tw.wiki.addTiddler({
		title: TiddlyWebSyncer.titleIsLoggedIn,
		text: "no"
	});
	// Get the login status
	this.getStatus();
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
		url: "http://tw5tiddlyweb.tiddlyspace.com/status",
		callback: function(err,data) {
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
				$tw.wiki.addTiddler({
					title: TiddlyWebSyncer.titleIsLoggedIn,
					text: isLoggedIn ? "yes" : "no"
				});
				if(isLoggedIn) {
					$tw.wiki.addTiddler({
						title: TiddlyWebSyncer.titleUserName,
						text: json.username
					});
				} else {
					$tw.wiki.deleteTiddler(TiddlyWebSyncer.titleUserName);
				}
			}
			// Invoke the callback if present
			if(callback) {
				callback(isLoggedIn,json);
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
					self.login(data.username,data.password);
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
		url: "http://tw5tiddlyweb.tiddlyspace.com/challenge/tiddlywebplugins.tiddlyspace.cookie_form",
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
				self.getStatus(function(isLoggedIn,json) {
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
		url: "http://tw5tiddlyweb.tiddlyspace.com/logout",
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
Some quick and dirty HTTP functions; to be refactored later. Options are:
	url: URL to retrieve
	type: GET, PUT, POST etc
	callback: function invoked with (err,data)
*/
TiddlyWebSyncer.prototype.httpRequest = function(options) {
	var type = options.type || "GET",
		client = new XMLHttpRequest(),
		data = "",
		f,results;
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
	client.open(type,options.url,true);
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
