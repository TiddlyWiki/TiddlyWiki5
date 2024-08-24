/*\
title: $:/plugins/tiddlywiki/tiddlyweb/tiddlywebadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with TiddlyWeb compatible servers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CONFIG_HOST_TIDDLER = "$:/config/tiddlyweb/host",
	DEFAULT_HOST_TIDDLER = "$protocol$//$host$/";

function TiddlyWebAdaptor(options) {
	this.wiki = options.wiki;
	this.host = this.getHost();
	this.recipe = undefined;
	this.hasStatus = false;
	this.logger = new $tw.utils.Logger("TiddlyWebAdaptor");
	this.isLoggedIn = false;
	this.isReadOnly = false;
	this.logoutIsAvailable = true;
}

TiddlyWebAdaptor.prototype.name = "tiddlyweb";

TiddlyWebAdaptor.prototype.supportsLazyLoading = true;

TiddlyWebAdaptor.prototype.setLoggerSaveBuffer = function(loggerForSaving) {
	this.logger.setSaveBuffer(loggerForSaving);
};

TiddlyWebAdaptor.prototype.isReady = function() {
	return this.hasStatus;
};

TiddlyWebAdaptor.prototype.getHost = function() {
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

TiddlyWebAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {
		bag: tiddler.fields.bag
	};
};

TiddlyWebAdaptor.prototype.getTiddlerRevision = function(title) {
	var tiddler = this.wiki.getTiddler(title);
	return tiddler.fields.revision;
};

/*
Get the current status of the TiddlyWeb connection
*/
TiddlyWebAdaptor.prototype.getStatus = function(callback) {
	// Get status
	var self = this;
	this.logger.log("Getting status");
	$tw.utils.httpRequest({
		url: this.host + "status",
		callback: function(err,data) {
			self.hasStatus = true;
			if(err) {
				return callback(err);
			}
			//If Browser-Storage plugin is present, cache pre-loaded tiddlers and add back after sync from server completes 
			if($tw.browserStorage && $tw.browserStorage.isEnabled()) {
				$tw.browserStorage.cachePreloadTiddlers();
			}
			// Decode the status JSON
			var json = null;
			try {
				json = JSON.parse(data);
			} catch(e) {
			}
			if(json) {
				self.logger.log("Status:",data);
				// Record the recipe
				if(json.space) {
					self.recipe = json.space.recipe;
				}
				// Check if we're logged in
				self.isLoggedIn = json.username !== "GUEST";
				self.isReadOnly = !!json["read_only"];
				self.isAnonymous = !!json.anonymous;
				self.logoutIsAvailable = "logout_is_available" in json ? !!json["logout_is_available"] : true;
			}
			// Invoke the callback if present
			if(callback) {
				callback(null,self.isLoggedIn,json.username,self.isReadOnly,self.isAnonymous);
			}
		}
	});
};

/*
Attempt to login and invoke the callback(err)
*/
TiddlyWebAdaptor.prototype.login = function(username,password,callback) {
	var options = {
		url: this.host + "challenge/tiddlywebplugins.tiddlyspace.cookie_form",
		type: "POST",
		data: {
			user: username,
			password: password,
			tiddlyweb_redirect: "/status" // workaround to marginalize automatic subsequent GET
		},
		callback: function(err) {
			callback(err);
		},
		headers: {
			"accept": "application/json",
			"X-Requested-With": "TiddlyWiki"
		}
	};
	this.logger.log("Logging in:",options);
	$tw.utils.httpRequest(options);
};

/*
*/
TiddlyWebAdaptor.prototype.logout = function(callback) {
	if(this.logoutIsAvailable) {
		var options = {
			url: this.host + "logout",
			type: "POST",
			data: {
				csrf_token: this.getCsrfToken(),
				tiddlyweb_redirect: "/status" // workaround to marginalize automatic subsequent GET
			},
			callback: function(err,data,xhr) {
				callback(err);
			},
			headers: {
				"accept": "application/json",
				"X-Requested-With": "TiddlyWiki"
			}
		};
		this.logger.log("Logging out:",options);
		$tw.utils.httpRequest(options);
	} else {
		alert("This server does not support logging out. If you are using basic authentication the only way to logout is close all browser windows");
		callback(null);
	}
};

/*
Retrieve the CSRF token from its cookie
*/
TiddlyWebAdaptor.prototype.getCsrfToken = function() {
	var regex = /^(?:.*; )?csrf_token=([^(;|$)]*)(?:;|$)/,
		match = regex.exec(document.cookie),
		csrf = null;
	if(match && (match.length === 2)) {
		csrf = match[1];
	}
	return csrf;
};

/*
Get an array of skinny tiddler fields from the server
*/
TiddlyWebAdaptor.prototype.getSkinnyTiddlers = function(callback) {
	var self = this;
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + this.recipe + "/tiddlers.json",
		data: {
			filter: "[all[tiddlers]] -[[$:/isEncrypted]] -[prefix[$:/temp/]] -[prefix[$:/status/]] -[[$:/boot/boot.js]] -[[$:/boot/bootprefix.js]] -[[$:/library/sjcl.js]] -[[$:/core]]"
		},
		callback: function(err,data) {
			// Check for errors
			if(err) {
				return callback(err);
			}
			// Process the tiddlers to make sure the revision is a string
			var tiddlers = JSON.parse(data);
			for(var t=0; t<tiddlers.length; t++) {
				tiddlers[t] = self.convertTiddlerFromTiddlyWebFormat(tiddlers[t]);
			}
			// Invoke the callback with the skinny tiddlers
			callback(null,tiddlers);
			// If Browswer Storage tiddlers were cached on reloading the wiki, add them after sync from server completes in the above callback.
			if($tw.browserStorage && $tw.browserStorage.isEnabled()) { 
				$tw.browserStorage.addCachedTiddlers();
			}
		}
	});
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
TiddlyWebAdaptor.prototype.saveTiddler = function(tiddler,callback,options) {
	var self = this;
	if(this.isReadOnly) {
		return callback(null);
	}
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + encodeURIComponent(this.recipe) + "/tiddlers/" + encodeURIComponent(tiddler.fields.title),
		type: "PUT",
		headers: {
			"Content-type": "application/json"
		},
		data: this.convertTiddlerToTiddlyWebFormat(tiddler),
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			//If Browser-Storage plugin is present, remove tiddler from local storage after successful sync to the server
			if($tw.browserStorage && $tw.browserStorage.isEnabled()) {
				$tw.browserStorage.removeTiddlerFromLocalStorage(tiddler.fields.title)
			}
			// Save the details of the new revision of the tiddler
			var etag = request.getResponseHeader("Etag");
			if(!etag) {
				callback("Response from server is missing required `etag` header");
			} else {
				var etagInfo = self.parseEtag(etag);
				// Invoke the callback
				callback(null,{
					bag: etagInfo.bag
				},etagInfo.revision);
			}
		}
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)
*/
TiddlyWebAdaptor.prototype.loadTiddler = function(title,callback) {
	var self = this;
	$tw.utils.httpRequest({
		url: this.host + "recipes/" + encodeURIComponent(this.recipe) + "/tiddlers/" + encodeURIComponent(title),
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			// Invoke the callback
			callback(null,self.convertTiddlerFromTiddlyWebFormat(JSON.parse(data)));
		}
	});
};

/*
Delete a tiddler and invoke the callback with (err)
options include:
tiddlerInfo: the syncer's tiddlerInfo for this tiddler
*/
TiddlyWebAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this;
	if(this.isReadOnly) {
		return callback(null);
	}
	// If we don't have a bag it means that the tiddler hasn't been seen by the server, so we don't need to delete it
	var bag = options.tiddlerInfo.adaptorInfo && options.tiddlerInfo.adaptorInfo.bag;
	if(!bag) {
		return callback(null,options.tiddlerInfo.adaptorInfo);
	}
	// Issue HTTP request to delete the tiddler
	$tw.utils.httpRequest({
		url: this.host + "bags/" + encodeURIComponent(bag) + "/tiddlers/" + encodeURIComponent(title),
		type: "DELETE",
		callback: function(err,data,request) {
			if(err) {
				return callback(err);
			}
			// Invoke the callback & return null adaptorInfo
			callback(null,null);
		}
	});
};

/*
Convert a tiddler to a field set suitable for PUTting to TiddlyWeb
*/
TiddlyWebAdaptor.prototype.convertTiddlerToTiddlyWebFormat = function(tiddler) {
	var result = {},
		knownFields = [
			"bag", "created", "creator", "modified", "modifier", "permissions", "recipe", "revision", "tags", "text", "title", "type", "uri"
		];
	if(tiddler) {
		$tw.utils.each(tiddler.fields,function(fieldValue,fieldName) {
			var fieldString = fieldName === "tags" ?
								tiddler.fields.tags :
								tiddler.getFieldString(fieldName); // Tags must be passed as an array, not a string

			if(knownFields.indexOf(fieldName) !== -1) {
				// If it's a known field, just copy it across
				result[fieldName] = fieldString;
			} else {
				// If it's unknown, put it in the "fields" field
				result.fields = result.fields || {};
				result.fields[fieldName] = fieldString;
			}
		});
	}
	// Default the content type
	result.type = result.type || "text/vnd.tiddlywiki";
	return JSON.stringify(result,null,$tw.config.preferences.jsonSpaces);
};

/*
Convert a field set in TiddlyWeb format into ordinary TiddlyWiki5 format
*/
TiddlyWebAdaptor.prototype.convertTiddlerFromTiddlyWebFormat = function(tiddlerFields) {
	var self = this,
		result = {};
	// Transfer the fields, pulling down the `fields` hashmap
	$tw.utils.each(tiddlerFields,function(element,title,object) {
		if(title === "fields") {
			$tw.utils.each(element,function(element,subTitle,object) {
				result[subTitle] = element;
			});
		} else {
			result[title] = tiddlerFields[title];
		}
	});
	// Make sure the revision is expressed as a string
	if(typeof result.revision === "number") {
		result.revision = result.revision.toString();
	}
	// Some unholy freaking of content types
	if(result.type === "text/javascript") {
		result.type = "application/javascript";
	} else if(!result.type || result.type === "None") {
		result.type = "text/x-tiddlywiki";
	}
	return result;
};

/*
Split a TiddlyWeb Etag into its constituent parts. For example:

```
"system-images_public/unsyncedIcon/946151:9f11c278ccde3a3149f339f4a1db80dd4369fc04"
```

Note that the value includes the opening and closing double quotes.

The parts are:

```
<bag>/<title>/<revision>:<hash>
```
*/
TiddlyWebAdaptor.prototype.parseEtag = function(etag) {
	var firstSlash = etag.indexOf("/"),
		lastSlash = etag.lastIndexOf("/"),
		colon = etag.lastIndexOf(":");
	if(firstSlash === -1 || lastSlash === -1 || colon === -1) {
		return null;
	} else {
		return {
			bag: $tw.utils.decodeURIComponentSafe(etag.substring(1,firstSlash)),
			title: $tw.utils.decodeURIComponentSafe(etag.substring(firstSlash + 1,lastSlash)),
			revision: etag.substring(lastSlash + 1,colon)
		};
	}
};

if($tw.browser && document.location.protocol.substr(0,4) === "http" ) {
	exports.adaptorClass = TiddlyWebAdaptor;
}

})();
