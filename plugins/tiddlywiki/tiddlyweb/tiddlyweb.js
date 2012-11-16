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
	$tw.plugins.tiddlyweb.getStatus(function(isLoggedIn,json) {
		if(!isLoggedIn) {
//			$tw.plugins.tiddlyweb.login(username,password);
		}
	});
};

$tw.plugins.tiddlyweb.getStatus = function(callback) {
	// Get status
	$tw.plugins.tiddlyweb.httpRequest({
		url: "http://tw5tiddlyweb.tiddlyspace.com/status",
		callback: function(err,data) {
			var json = null;
			try {
				json = JSON.parse(data);
			} catch (e) {
			}
			if(json) {
				var isLoggedIn = json.username !== "GUEST";
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
			if(callback) {
				callback(isLoggedIn,json);
			}
		}
	});
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

/*
Attempt to login to TiddlyWeb
*/
$tw.plugins.tiddlyweb.login = function(username,password,options) {
	options = options || {};
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
				console.log("login error",err);
			} else {
				$tw.plugins.tiddlyweb.getStatus(function(isLoggedIn,json) {
					console.log("isLoggedIn",isLoggedIn);
				});
				console.log("Result of login",data,httpRequest);
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
console.log("onreadystatechange",this.status,this.statusText,this.getAllResponseHeaders());
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
