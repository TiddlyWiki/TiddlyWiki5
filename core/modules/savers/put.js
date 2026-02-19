/*\
title: $:/core/modules/savers/put.js
type: application/javascript
module-type: saver
\*/

"use strict";

var retrieveETag = function(self) {
	var headers = {
		Accept: "*/*"
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

var PutSaver = function(wiki) {
	this.wiki = wiki;
	var self = this;
	var uri = this.uri();
	// Async server probe. Until probe finishes, save will fail fast

	$tw.utils.httpRequest({
		url: uri,
		type: "OPTIONS",
		callback: function(err,data,xhr) {
			// Check DAV header http://www.webdav.org/specs/rfc2518.html#rfc.section.9.1
			if(!err) {
				self.serverAcceptsPuts = xhr.status >= 200 && xhr.status < 300 && !!xhr.getResponseHeader("dav");
			}
		}
	});
	retrieveETag(this);
};

PutSaver.prototype.uri = function() {
	return document.location.toString().split("#")[0];
};

// TODO: in case of edit conflict

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
	$tw.notifier.display("$:/language/Notifications/Save/Starting");
	$tw.utils.httpRequest({
		url: this.uri(),
		type: "PUT",
		headers: headers,
		data: text,
		callback: function(err,data,xhr) {
			if(err) {
				var status = xhr.status,
					errorMsg = err;
				if(status === 412) { // file changed on server
					errorMsg = $tw.language.getString("Error/PutEditConflict");
				} else if(status === 401) { // authentication required
					errorMsg = $tw.language.getString("Error/PutUnauthorized");
				} else if(status === 403) { // permission denied
					errorMsg = $tw.language.getString("Error/PutForbidden");
				}
				if (xhr.responseText) {
					// treat any server response like a plain text error explanation
					errorMsg = errorMsg + "\n\n" + xhr.responseText;
				}
				callback(errorMsg); // fail
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

PutSaver.prototype.info = {
	name: "put",
	priority: 2000,
	capabilities: ["save","autosave"]
};

exports.canSave = function(wiki) {
	return /^https?:/.test(location.protocol);
};

exports.create = function(wiki) {
	return new PutSaver(wiki);
};
