/*\
title: $:/core/modules/savers/gitea.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the gitea

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var GiteaSaver = function(wiki) {
	this.wiki = wiki;
};

GiteaSaver.prototype.save = function(text,method,callback) {
	var self = this,
		username = this.wiki.getTiddlerText("$:/gitea/Username"),
		password = $tw.utils.getPassword("gitea"),
		repo = this.wiki.getTiddlerText("$:/gitea/Repo"),
		path = this.wiki.getTiddlerText("$:/gitea/Path",""),
		filename = this.wiki.getTiddlerText("$:/gitea/Filename"),
		branch = this.wiki.getTiddlerText("$:/gitea/Branch") || "master",
		endpoint = this.wiki.getTiddlerText("$:/gitea/ServerURL") || "https://gitea",
		headers = {
			"Accept": "application/json",
			"Content-Type": "application/json;charset=UTF-8",
			"Authorization": "Basic " + window.btoa(username + ":" + password)
		};
	// Bail if we don't have everything we need
	if(!username || !password || !repo || !path || !filename) {
		return false;
	}
	// Make sure the path start and ends with a slash
	if(path.substring(0,1) !== "/") {
		path = "/" + path;
	}
	if(path.substring(path.length - 1) !== "/") {
		path = path + "/";
	}
	// Compose the base URI
	var uri = endpoint + "/repos/" + repo + "/contents" + path;
	// Perform a get request to get the details (inc shas) of files in the same path as our file
	$tw.utils.httpRequest({
		url: uri,
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
			if(xhr.status !== 404) {
				getResponseData = JSON.parse(getResponseDataJson);
				$tw.utils.each(getResponseData,function(details) {
					if(details.name === filename) {
						sha = details.sha;
					}
				});
			}
			var data = {
				message: $tw.language.getRawString("ControlPanel/Saving/GitService/CommitMessage"),
				content: $tw.utils.base64Encode(text),
				branch: branch,
				sha: sha
			};
			// Perform a PUT request to save the file
			$tw.utils.httpRequest({
				url: uri + filename,
				type: "PUT",
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
GiteaSaver.prototype.info = {
	name: "gitea",
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
	return new GiteaSaver(wiki);
};

})();
