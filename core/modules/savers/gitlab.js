/*\
title: $:/core/modules/savers/gitlab.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the GitLab REST API

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: true */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var GitLabSaver = function(wiki) {
	this.wiki = wiki;
};

GitLabSaver.prototype.save = function(text,method,callback) {
	/* See https://docs.gitlab.com/ee/api/repository_files.html */
	var self = this,
		username = this.wiki.getTiddlerText("$:/GitLab/Username"),
		password = $tw.utils.getPassword("gitlab"),
		repo = this.wiki.getTiddlerText("$:/GitLab/Repo"),
		path = this.wiki.getTiddlerText("$:/GitLab/Path",""),
		filename = this.wiki.getTiddlerText("$:/GitLab/Filename"),
		branch = this.wiki.getTiddlerText("$:/GitLab/Branch") || "master",
		endpoint = this.wiki.getTiddlerText("$:/GitLab/ServerURL") || "https://gitlab.com/api/v4",
		headers = {
			"Content-Type": "application/json;charset=UTF-8",
			"Private-Token": password
		};
	// Bail if we don't have everything we need
	if(!username || !password || !repo || !filename) {
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
	var uri = endpoint + "/projects/" + encodeURIComponent(repo) + "/repository/";
	// Perform a get request to get the details (inc shas) of files in the same path as our file
	$tw.utils.httpRequest({
		url: uri + "tree/?path=" + encodeURIComponent(path.replace(/^\/+|\/$/g, '')) + "&branch=" + encodeURIComponent(branch.replace(/^\/+|\/$/g, '')),
		type: "GET",
		headers: headers,
		callback: function(err,getResponseDataJson,xhr) {
			var getResponseData,sha = "";
			if(err && xhr.status !== 404) {
				return callback(err);
			}
			var requestType = "POST";
			if(xhr.status !== 404) {
				getResponseData = JSON.parse(getResponseDataJson);
				$tw.utils.each(getResponseData,function(details) {
					if(details.name === filename) {
						requestType = "PUT";
						sha = details.sha;
					}
				});
			}
			var data = {
				commit_message: $tw.language.getString("ControlPanel/Saving/GitService/CommitMessage"),
				content: text,
				branch: branch,
				sha: sha
			};
			// Perform a request to save the file
			$tw.utils.httpRequest({
				url: uri + "files/" + encodeURIComponent(path.replace(/^\/+/, '') + filename),
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
GitLabSaver.prototype.info = {
	name: "gitlab",
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
	return new GitLabSaver(wiki);
};

})();
