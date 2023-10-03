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
		username = this.wiki.getTiddlerText("$:/Gitea/Username"),
		password = $tw.utils.getPassword("Gitea"),
		repo = this.wiki.getTiddlerText("$:/Gitea/Repo"),
		path = this.wiki.getTiddlerText("$:/Gitea/Path",""),
		filename = this.wiki.getTiddlerText("$:/Gitea/Filename"),
		branch = this.wiki.getTiddlerText("$:/Gitea/Branch") || "master",
		endpoint = this.wiki.getTiddlerText("$:/Gitea/ServerURL") || "https://gitea",
		headers = {
			"Accept": "application/json",
			"Content-Type": "application/json;charset=UTF-8",
			"Authorization": "token " + password
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
			var use_put = true;
			if(xhr.status !== 404) {
				getResponseData = $tw.utils.parseJSONSafe(getResponseDataJson);
				$tw.utils.each(getResponseData,function(details) {
					if(details.name === filename) {
						sha = details.sha;
					}
				});
				if(sha === ""){
					use_put = false;
				}
			}
			var data = {
				message: $tw.language.getString("ControlPanel/Saving/GitService/CommitMessage"),
				content: $tw.utils.base64Encode(text),
				sha: sha
			};
			$tw.utils.httpRequest({
				url: endpoint + "/repos/" + repo + "/branches/" + branch,
				type: "GET",
				headers: headers,
				callback: function(err,getResponseDataJson,xhr) {
					if(xhr.status === 404) {
						callback("Please ensure the branch in the Gitea repo exists");
					}else{
						data["branch"] = branch;
						self.upload(uri + filename, use_put?"PUT":"POST", headers, data, callback);
					}
				}
			});
		}
	});
	return true;
};

GiteaSaver.prototype.upload = function(uri,method,headers,data,callback) {
	$tw.utils.httpRequest({
		url: uri,
		type: method,
		headers: headers,
		data: JSON.stringify(data),
		callback: function(err,putResponseDataJson,xhr) {
			if(err) {
				return callback(err);
			}
			var putResponseData = $tw.utils.parseJSONSafe(putResponseDataJson);
			callback(null);
		}
	});
};

/*
Information about this saver
*/
GiteaSaver.prototype.info = {
	name: "Gitea",
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
