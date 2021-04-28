/*\
title: $:/core/modules/savers/put.js
type: application/javascript
module-type: saver

Saves wiki by performing a PUT request to the server

Works with any server which accepts a PUT request
to the current URL, such as a WebDAV server.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Retrieve ETag if available
*/
var retrieveETag = function(self) {
	var headers = {
		Accept: "*/*;charset=UTF-8"
	};
	$tw.utils.httpRequest({
		url: self.uri(),
		type: "HEAD",
		headers: headers,
		callback: function(err,data,xhr) {
			if(err) {
				return;
			}
			var etag = xhr.getResponseHeader("ETag");
			if(!etag) {
				return;
			}
			self.etag = etag.replace(/^W\//,"");
		}
	});
};


/*
Select the appropriate saver module and set it up
*/
var PutSaver = function(wiki) {
	this.wiki = wiki;
	var self = this;
	var uri = this.uri();
	// Async server probe. Until probe finishes, save will fail fast
	// See also https://github.com/Jermolene/TiddlyWiki5/issues/2276
	$tw.utils.httpRequest({
		url: uri,
		type: "OPTIONS",
		callback: function(err,data,xhr) {
			// Check DAV header http://www.webdav.org/specs/rfc2518.html#rfc.section.9.1
			if(!err) {
				self.serverAcceptsPuts = xhr.status === 200 && !!xhr.getResponseHeader("dav");
			}
		}
	});
	retrieveETag(this);
};

PutSaver.prototype.uri = function() {
	return document.location.toString().split("#")[0];
};

// TODO: in case of edit conflict
// Prompt: Do you want to save over this? Y/N
// Merging would be ideal, and may be possible using future generic merge flow
PutSaver.prototype.save = function(text,method,callback) {
	if(!this.serverAcceptsPuts) {
		return false;
	}
	var self = this;
	var headers = {
		"Content-Type": "text/html;charset=UTF-8"
	};
	if(this.etag) {
		headers["If-Match"] = this.etag;
	}
	$tw.utils.httpRequest({
		url: this.uri(),
		type: "PUT",
		headers: headers,
		data: text,
		callback: function(err,data,xhr) {
			if(err) {
				// response is textual: "XMLHttpRequest error code: 412"
				var status = Number(err.substring(err.indexOf(':') + 2, err.length))
				if(status === 412) { // file changed on server
					callback($tw.language.getString("Error/PutEditConflict"));
				} else if(status === 401) { // authentication required
					callback($tw.language.getString("Error/PutUnauthorized"));
				} else if(status === 403) { // permission denied
					callback($tw.language.getString("Error/PutForbidden"));
				} else {
					callback(err); // fail
				}
			} else {
				self.etag = xhr.getResponseHeader("ETag");
				if(self.etag == null) {
					retrieveETag(self);
				}
				callback(null); // success
			}
		}
	});
	return true;
};

/*
Information about this saver
*/
PutSaver.prototype.info = {
	name: "put",
	priority: 2000,
	capabilities: ["save","autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return /^https?:/.test(location.protocol);
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new PutSaver(wiki);
};

})();
