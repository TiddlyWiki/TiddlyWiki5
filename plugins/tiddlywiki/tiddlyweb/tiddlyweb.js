/*\
title: $:/plugins/tiddlywiki/tiddlyweb/tiddlyweb.js
type: application/javascript
module-type: browser-startup

Main TiddlyWeb integration module

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

$tw.plugins.tiddlyweb = {
	titleIsLoggedIn: "$:/plugins/tiddlyweb/IsLoggedIn",
	titleUserName: "$:/plugins/tiddlyweb/UserName"
};

/*
Startup function that sets up TiddlyWeb and logs the user in. After login, any tiddlyweb-startup modules are executed.
*/
exports.startup = function() {
	if(!$tw.browser) {
		return;
	}
	// Mark us as not logged in
	$tw.wiki.addTiddler({
		title: $tw.plugins.tiddlyweb.titleIsLoggedIn,
		text: "no"
	});
	// Get the login status
	$tw.plugins.tiddlyweb.getStatus();
};

/*
Error handling
*/
$tw.plugins.tiddlyweb.showError = function(error) {
	alert("TiddlyWeb error: " + error);
	console.log("TiddlyWeb error: " + error);
};

/*
Invoke any tiddlyweb-startup modules
*/
$tw.plugins.tiddlyweb.invokeTiddlyWebStartupModules = function(loggedIn) {
	$tw.modules.forEachModuleOfType("tiddlyweb-startup",function(title,module) {
		module.startup(loggedIn);
	});
};

$tw.plugins.tiddlyweb.getCsrfToken = function() {
	var regex = /^(?:.*; )?csrf_token=([^(;|$)]*)(?:;|$)/,
		match = regex.exec(document.cookie),
		csrf = null;
	if (match && (match.length === 2)) {
		csrf = match[1];
	}
	return csrf;
};

$tw.plugins.tiddlyweb.getStatus = function(callback) {
	// Get status
	$tw.plugins.tiddlyweb.httpRequest({
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
					title: $tw.plugins.tiddlyweb.titleIsLoggedIn,
					text: isLoggedIn ? "yes" : "no"
				});
				if(isLoggedIn) {
					$tw.wiki.addTiddler({
						title: $tw.plugins.tiddlyweb.titleUserName,
						text: json.username
					});
				} else {
					$tw.wiki.deleteTiddler($tw.plugins.tiddlyweb.titleUserName);
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
$tw.plugins.tiddlyweb.promptLogin = function() {
	$tw.plugins.tiddlyweb.getStatus(function(isLoggedIn,json) {
		if(!isLoggedIn) {
			$tw.passwordPrompt.createPrompt({
				serviceName: "Login to TiddlySpace",
				callback: function(data) {
					$tw.plugins.tiddlyweb.login(data.username,data.password);
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
$tw.plugins.tiddlyweb.login = function(username,password,callback) {
	var httpRequest = $tw.plugins.tiddlyweb.httpRequest({
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
				$tw.plugins.tiddlyweb.getStatus(function(isLoggedIn,json) {
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
$tw.plugins.tiddlyweb.logout = function(options) {
	options = options || {};
	var httpRequest = $tw.plugins.tiddlyweb.httpRequest({
		url: "http://tw5tiddlyweb.tiddlyspace.com/logout",
		type: "POST",
		data: {
			csrf_token: $tw.plugins.tiddlyweb.getCsrfToken(),
			tiddlyweb_redirect: "/status" // workaround to marginalize automatic subsequent GET
		},
		callback: function(err,data) {
			if(err) {
				console.log("logout error",err);
			} else {
				$tw.plugins.tiddlyweb.getStatus(function(isLoggedIn,json) {
					console.log("after logout, isLoggedIn",isLoggedIn);
				});
				console.log("Result of logout",data,httpRequest);
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
$tw.plugins.tiddlyweb.httpRequest = function(options) {
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

})();
