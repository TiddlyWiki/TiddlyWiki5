/*\
title: $:/core/modules/savers/git-services/github.js
caption: GitHub
type: application/javascript
default-api-url: https://api.github.com
module-type: gitservice

Saves wiki by pushing a commit to the GitHub v3 REST API

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.requestTypeIfFileExists = "PUT";
exports.requestTypeIfFileNotExists = "PUT";

exports.headers = function(username,password) {
	return {
		"Accept": "application/vnd.github.v3+json",
		"Content-Type": "application/json;charset=UTF-8",
		"Authorization": "Basic " + window.btoa(username + ":" + password)
	};
};

exports.getRequestUriForFilelist = function(apiUrl,repo,path) {
	return apiUrl + "/repos/" + repo + "/contents" + path;
};

exports.getRequestUriForSendingFile = function(apiUrl,repo,path,filename) {
	return apiUrl + "/repos/" + repo + "/contents" + path + filename;
};

exports.formatDataForCreatingCommit = function(message,encodedContent,branch,sha) {
	return {
		message: message,
		content: encodedContent,
		branch: branch,
		sha: sha
	}
}

})();
