/*\
title: $:/core/modules/savers/gitlab.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the GitLab REST API

\*/

"use strict";

/*
Select the appropriate saver module and set it up
*/
const GitLabSaver = function(wiki) {
	this.wiki = wiki;
};

GitLabSaver.prototype.save = function(text,method,callback) {
	/* See https://docs.gitlab.com/ee/api/repository_files.html */
	const self = this;
	const username = this.wiki.getTiddlerText("$:/GitLab/Username");
	const password = $tw.utils.getPassword("gitlab");
	const repo = this.wiki.getTiddlerText("$:/GitLab/Repo");
	let path = this.wiki.getTiddlerText("$:/GitLab/Path","");
	const filename = this.wiki.getTiddlerText("$:/GitLab/Filename");
	const branch = this.wiki.getTiddlerText("$:/GitLab/Branch") || "master";
	const endpoint = this.wiki.getTiddlerText("$:/GitLab/ServerURL") || "https://gitlab.com/api/v4";
	const headers = {
		"Content-Type": "application/json;charset=UTF-8",
		"Private-Token": password
	};
	// Bail if we don't have everything we need
	if(!username || !password || !repo || !filename) {
		return false;
	}
	// Make sure the path start and ends with a slash
	if(path.substring(0,1) !== "/") {
		path = `/${path}`;
	}
	if(path.substring(path.length - 1) !== "/") {
		path += "/";
	}
	// Compose the base URI
	const uri = `${endpoint}/projects/${encodeURIComponent(repo)}/repository/`;
	// Perform a get request to get the details (inc shas) of files in the same path as our file
	$tw.utils.httpRequest({
		url: `${uri}tree/?path=${encodeURIComponent(path.replace(/^\/+|\/$/g,''))}&branch=${encodeURIComponent(branch.replace(/^\/+|\/$/g,''))}`,
		type: "GET",
		headers,
		callback(err,getResponseDataJson,xhr) {
			let getResponseData; let sha = "";
			if(err && xhr.status !== 404) {
				return callback(err);
			}
			let requestType = "POST";
			if(xhr.status !== 404) {
				getResponseData = $tw.utils.parseJSONSafe(getResponseDataJson);
				$tw.utils.each(getResponseData,(details) => {
					if(details.name === filename) {
						requestType = "PUT";
						sha = details.sha;
					}
				});
			}
			const data = {
				commit_message: $tw.language.getString("ControlPanel/Saving/GitService/CommitMessage"),
				content: text,
				branch,
				sha
			};
			// Perform a request to save the file
			$tw.utils.httpRequest({
				url: `${uri}files/${encodeURIComponent(path.replace(/^\/+/,'') + filename)}`,
				type: requestType,
				headers,
				data: JSON.stringify(data),
				callback(err,putResponseDataJson,xhr) {
					if(err) {
						return callback(err);
					}
					const putResponseData = $tw.utils.parseJSONSafe(putResponseDataJson);
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
	capabilities: ["save","autosave"]
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
