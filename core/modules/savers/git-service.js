/*\
title: $:/core/modules/savers/git-service.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the selected Git service REST API

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var base64utf8 = require("$:/core/modules/utils/base64-utf8/base64-utf8.module.js");

/*
Select the appropriate saver module and set it up
*/
var GitHubSaver = function(wiki) {
	this.wiki = wiki;
};

GitHubSaver.prototype.save = function(text,method,callback) {
	var self = this,
		titleOfSelectedService = this.wiki.getTiddlerText("$:/GitHub/ServiceType"),
		service = require(titleOfSelectedService),
		username = this.wiki.getTiddlerText("$:/GitHub/Username"),
		password = $tw.utils.getPassword("github"),
		repo = this.wiki.getTiddlerText("$:/GitHub/Repo"),
		path = this.wiki.getTiddlerText("$:/GitHub/Path"),
		filename = this.wiki.getTiddlerText("$:/GitHub/Filename"),
		branch = this.wiki.getTiddlerText("$:/GitHub/Branch") || "master",
		apiUrl = this.wiki.getTiddlerText("$:/GitHub/ServerURL") || this.wiki.getTiddler(titleOfSelectedService).fields['default-api-url'];
	// Bail if we don't have everything we need
	if(!service || !username || !password || !repo || !path || !filename) {
		return false;
	}
	// Make sure the path start and ends with a slash
	if(path.substring(0,1) !== "/") {
		path = "/" + path;
	}
	if(path.substring(path.length - 1) !== "/") {
		path = path + "/";
	}
	// Get service-specific headers
	var headers = service.headers(username, password);
	// Perform a get request to get the details (inc shas) of files in the same path as our file
	$tw.utils.httpRequest({
		url: service.getRequestUriForFilelist(apiUrl,repo,path),
		type: "GET",
		headers: headers,
		data: {
			ref: branch
		},
		callback: function(err,getResponseDataJson,xhr) {
			var getResponseData,sha = "";
			if(err && xhr.status !== 404) {
				return callback(err);					
			}
			var requestType = service.requestTypeIfFileExists;
			if(xhr.status !== 404) {
				getResponseData = JSON.parse(getResponseDataJson);
				$tw.utils.each(getResponseData,function(details) {
					if(details.name === filename) {
						sha = details.sha;
					}
				});				
			} else {
				requestType = service.requestTypeIfFileNotExists;
			}
			var data = service.formatDataForCreatingCommit(
				"Saved by TiddlyWiki",
				base64utf8.base64.encode.call(base64utf8,text),
				branch,
				sha
			);
			// Perform a PUT request to save the file
			$tw.utils.httpRequest({
				url: service.getRequestUriForSendingFile(apiUrl,repo,path,filename),
				type: requestType,
				headers: headers,
				data: JSON.stringify(data),
				callback: function(err,putResponseDataJson,xhr) {
					if(err) {
						return callback(err);
					}
					var putResponseData = JSON.parse(putResponseDataJson);
					callback(null);
				}
			});
		}
	});
	return true;
};

/*
Information about this saver
*/
GitHubSaver.prototype.info = {
	name: "github",
	priority: 2000,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new GitHubSaver(wiki);
};

})();
