/*\
title: $:/core/modules/savers/git-services/gitlab.js
caption: GitLab
type: application/javascript
default-api-url: https://gitlab.com/api/v4
module-type: gitservice

Saves wiki by pushing a commit to the GitLab REST API

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/* See https://docs.gitlab.com/ee/api/repository_files.html */

exports.requestTypeIfFileExists = "PUT";
exports.requestTypeIfFileNotExists = "POST";

exports.headers = function(username, password) {
	return {
		"Content-Type": "application/json;charset=UTF-8",
		"Private-Token": password
	};
};

exports.getRequestUriForFilelist = function(apiUrl,repo,path) {
	return apiUrl + "/projects/" + encodeURIComponent(repo) + "/repository/tree/" + encodeURIComponent(path.replace(/^\/+|\/$/g, ''));
};

exports.getRequestUriForSendingFile = function(apiUrl,repo,path,filename) {
	return apiUrl + "/projects/" + encodeURIComponent(repo) + "/repository/files/" + encodeURIComponent(path.replace(/^\/+/, '') + filename);
};

exports.formatDataForCreatingCommit = function(message,encodedContent,branch,sha) {
	return {
		commit_message: message,
		content: encodedContent,
		branch: branch,
		sha: sha
	}
}

})();
