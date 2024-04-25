/*\
title: $:/core/modules/savers/bitbucket.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the BitBucket REST API

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var BitBucketSaver = function(wiki) {
	this.wiki = wiki;

	this._getBitbucketErrorMessage = function(response) {
	    var errorMessage;
        if(response) {
            var errResponseData;
            try {
                errResponseData = JSON.parse(response);
                if (errResponseData.hasOwnProperty("error") && errResponseData.error.hasOwnProperty("message")) {
                    errorMessage = errResponseData.error.message;
                }
            } catch (e) {
                // ignore
            }
        }
        return errorMessage;
    }
};

    BitBucketSaver.prototype.save = function(text,method,callback) {
	var self = this,
		username = this.wiki.getTiddlerText("$:/BitBucket/Username"),
		password = $tw.utils.getPassword("bitbucket"),
		repo = this.wiki.getTiddlerText("$:/BitBucket/Repo"),
		filename = this.wiki.getTiddlerText("$:/BitBucket/Filename"),
		endpoint = this.wiki.getTiddlerText("$:/BitBucket/ServerURL","https://bitbucket.org"),
		headers = {
			"Accept": "application/json",
			"Authorization": "Basic " + window.btoa(username + ":" + password)
		};
	// Bail if we don't have everything we need
	if(!username || !password || !repo || !filename || !endpoint) {
		return false;
	}
    // Compose the base URI
    var uri = endpoint + "/api/2.0/repositories/" + repo;
	var data = new FormData();
	data.append("files", new Blob([text]), filename);
	$tw.utils.httpRequest({
		url: uri + "/downloads",
		type: "POST",
		headers: headers,
        data: data,
        callback: function(err,postResponseDataJson,xhr) {
            if(err || xhr.status !== 201) {
                var errorMessage = self._getBitbucketErrorMessage(xhr.response);
                if(errorMessage) {
                    return callback(errorMessage);
                }
                return callback(err);
            }
            callback(null);
		}
	});
	return true;
};

/*
Information about this saver
*/
BitBucketSaver.prototype.info = {
	name: "bitbucket",
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
	return new BitBucketSaver(wiki);
};

})();
