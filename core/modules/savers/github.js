/*\
title: $:/core/modules/savers/github.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the GitHub v3 REST API

\*/

"use strict";

/*
Select the appropriate saver module and set it up
*/
const GitHubSaver = function(wiki) {
	this.wiki = wiki;
};

GitHubSaver.prototype.save = function(text,method,callback) {
	const self = this;
	const username = this.wiki.getTiddlerText("$:/GitHub/Username");
	const password = $tw.utils.getPassword("github");
	const repo = this.wiki.getTiddlerText("$:/GitHub/Repo");
	let path = this.wiki.getTiddlerText("$:/GitHub/Path","");
	const filename = this.wiki.getTiddlerText("$:/GitHub/Filename");
	const branch = this.wiki.getTiddlerText("$:/GitHub/Branch") || "main";
	const endpoint = this.wiki.getTiddlerText("$:/GitHub/ServerURL") || "https://api.github.com";
	const headers = {
		"Accept": "application/vnd.github.v3+json",
		"Content-Type": "application/json;charset=UTF-8",
		"Authorization": `Basic ${$tw.utils.base64Encode(`${username}:${password}`)}`,
		"If-None-Match": ""
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
	const uri = `${endpoint}/repos/${repo}/contents${path}`;
	// Perform a get request to get the details (inc shas) of files in the same path as our file
	$tw.utils.httpRequest({
		url: uri,
		type: "GET",
		headers,
		data: {
			ref: branch
		},
		callback(err,getResponseDataJson,xhr) {
			let getResponseData; let sha = "";
			if(err && xhr.status !== 404) {
				return callback(err);
			}
			if(xhr.status !== 404) {
				getResponseData = $tw.utils.parseJSONSafe(getResponseDataJson);
				$tw.utils.each(getResponseData,(details) => {
					if(details.name === filename) {
						sha = details.sha;
					}
				});
			}
			const data = {
				message: $tw.language.getString("ControlPanel/Saving/GitService/CommitMessage"),
				content: $tw.utils.base64Encode(text),
				branch,
				sha
			};
			// Perform a PUT request to save the file
			$tw.utils.httpRequest({
				url: uri + filename,
				type: "PUT",
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
GitHubSaver.prototype.info = {
	name: "github",
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
	return new GitHubSaver(wiki);
};
