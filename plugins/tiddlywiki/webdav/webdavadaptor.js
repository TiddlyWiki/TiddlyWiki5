/*\
title: $:/plugins/tiddlywiki/webdav/webdavadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with WebDAV compatible servers
Heavily based on WebDAV Adaptor

Revised by Sebastian Silva <sebastian@fuentelibre.org>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CONFIG_HOST_TIDDLER = "$:/config/webdav/host",
	DEFAULT_HOST_TIDDLER = "$protocol$//$host$/";

function dirname(path) {
	return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
}

function WebDAVAdaptor(options) {
	this.wiki = options.wiki;
	this.host = this.getHost();
	this.tiddlersBaseURL = dirname(location.pathname) + "/tiddlers";
	this.hasStatus = false;
	this.logger = new $tw.utils.Logger("WebDAVAdaptor");
}

WebDAVAdaptor.prototype.name = "webdav";
WebDAVAdaptor.prototype.knownDirs = [];

WebDAVAdaptor.prototype.isReady = function() {
	return this.hasStatus;
};

WebDAVAdaptor.prototype.getHost = function() {
	var text = this.wiki.getTiddlerText(CONFIG_HOST_TIDDLER,DEFAULT_HOST_TIDDLER),
		substitutions = [
			{name: "protocol", value: document.location.protocol},
			{name: "host", value: document.location.host}
		];
	for(var t=0; t<substitutions.length; t++) {
		var s = substitutions[t];
		text = $tw.utils.replaceString(text,new RegExp("\\$" + s.name + "\\$","mg"),s.value);
	}
	return text;
};

/*
Make a directory recursively
*/
WebDAVAdaptor.prototype.mkdir_p = function (path, callback) {
	var parent = dirname(path);
	var self = this;
	if (this!==undefined) {
		if (!(this.knownDirs.includes(parent))) {
			if (parent!==path) {
				this.mkdir_p(parent, callback);
			}
		}
		$tw.utils.httpRequest({
			type: "MKCOL",
			url: this.tiddlersBaseURL + "/" + path,
			returnProp: "responseXML",
			headers: {accept: "text/xml; charset=UTF-8"},
			callback: function(err, doc, request) {
				// Check for errors
				if(err) {
					return callback(err);
				}
				self.knownDirs.push ( path );
			}
		});

	};
}
WebDAVAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return { };
};

/*
Get the current status of the WebDAV connection
*/
WebDAVAdaptor.prototype.getStatus = function(callback) {
	// Get status
	var self = this;
	this.logger.log("Status is fine");
	self.hasStatus = true;
	var isLoggedIn = false;

	callback(null,isLoggedIn,"GUEST");
	// or return callback(err);
};

/*
Get an array of skinny tiddler fields from the server
*/
WebDAVAdaptor.prototype.getSkinnyTiddlers = function(callback) {
	var self = this;
	$tw.utils.httpRequest({
		type: "PROPFIND",
		url: this.tiddlersBaseURL + "/",
		returnProp: "responseXML",
		headers: {accept: "text/xml; charset=UTF-8"},
		callback: function(err, doc, request) {
			// Check for errors
			if(err) {
				if (err.indexOf("404")>0) {
					$tw.utils.httpRequest({
						type: "MKCOL",
						url: self.tiddlersBaseURL,
						headers: {accept: "text/xml; charset=UTF-8"},
						callback: function(err, doc, request) {
							// Check for errors
							if(err) {
								return callback(err);
							}
						}
					});
				}
				else {
					return callback(err);
				}
			}

			if (doc!==undefined) {
				const ns = "DAV:";
				var tiddlers = [];
				var items = doc.children[0].children;
				// Start at 1, because the 0th is the same as self.
				for(var i=1; i< items.length; i++) {
					var response	 = items[i];
					var href		 = response.getElementsByTagNameNS(ns, 'href')[0].firstChild.nodeValue;
					href = href.replace(/\/$/, ''); // Strip trailing slash
					href = href.replace(self.tiddlersBaseURL + "/", ""); // Strip path
					href = decodeURIComponent(href);
					var propstat	 = response.getElementsByTagNameNS(ns, 'propstat')[0];
					var prop		 = propstat.getElementsByTagNameNS(ns, 'prop')[0];
					var resourcetype = prop.getElementsByTagNameNS(ns, 'resourcetype')[0];
					var collection   = resourcetype.getElementsByTagNameNS(ns, 'collection')[0];

					if (prop.getElementsByTagNameNS(ns, 'getcontenttype').length > 0) {
						// var type = prop.getElementsByTagNameNS(ns, 'getcontenttype')[0].innerHTML;
						if (href.endsWith(".tid") && href!=="$__StoryList.tid") {
							var type = "application/x-tiddler";
							// var revision	 = prop.getElementsByTagNameNS(ns, 'getetag')[0].innerHTML;
							var revision	 = prop.getElementsByTagNameNS(ns, 'getlastmodified')[0].innerHTML;
						  href = href.slice(0, -4);
						  tiddlers.push({ title: href,
										revision: revision,
										type: type });
						}
					}
					if (collection) {
						if (!(self.knownDirs.includes(href))) {
							self.knownDirs.push(href);
						}
					}
				}
				callback(null, tiddlers);
			}
		}
	});
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
WebDAVAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	var self = this;
	// Save the tiddler as a self contained templated file
	var content = self.wiki.renderTiddler("text/plain","$:/core/templates/tid-tiddler",
		{variables: {currentTiddler: tiddler.fields.title}});
	var url = this.tiddlersBaseURL + "/" + encodeURIComponent(tiddler.fields.title) + ".tid";
	var path = dirname(tiddler.fields.title);
	if (path!==tiddler.fields.title && !(self.knownDirs.includes(path))) {
		this.mkdir_p(path, callback);
	}
	$tw.utils.httpRequest({
		url: this.tiddlersBaseURL + "/" + tiddler.fields.title + ".tid",
		type: "PUT",
		headers: {
			"Content-type": "text/plain"
		},
		data: content,
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			// Save the details of the new revision of the tiddler
			var revision = new Date().toGMTString(); // request.getResponseHeader("Etag");

			// Invoke the callback
			callback(null, {}, revision);
		}
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
WebDAVAdaptor.prototype.loadTiddler = function(title,callback) {
	var self = this;
	$tw.utils.httpRequest({
		url: this.tiddlersBaseURL + "/" + title + ".tid",
		headers: {accept: "charset=UTF-8"},
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			// Invoke the callback
			var type = "application/x-tiddler";
			var tiddler = $tw.wiki.deserializeTiddlers(type, data)[0];
			tiddler.revision = request.getResponseHeader("Last-Modified")
			callback(null, tiddler);
		}
	});
};

/*
Delete a tiddler and invoke the callback with (err)
options include:
tiddlerInfo: the syncer's tiddlerInfo for this tiddler
*/
WebDAVAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	// Issue HTTP request to delete the tiddler
	$tw.utils.httpRequest({
		url: this.tiddlersBaseURL + "/" + title + ".tid",
		type: "DELETE",
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			// Invoke the callback
			callback(null);
		}
	});
};

if($tw.browser && document.location.protocol.substr(0,4) === "http" ) {
	exports.adaptorClass = WebDAVAdaptor;
}

})();
