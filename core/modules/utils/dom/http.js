/*\
title: $:/core/modules/utils/dom/http.js
type: application/javascript
module-type: utils

HTTP support

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Manage tm-http-request events. Options are:
wiki - the wiki object to use
*/
function HttpClient(options) {
	options = options || {};
	this.wiki = options.wiki || $tw.wiki;
}

HttpClient.prototype.handleHttpRequest = function(event) {
	console.log("Making an HTTP request",event)
	var self = this,
		paramObject = event.paramObject || {},
		url = paramObject.url,
		completionActions = paramObject.oncompletion || "",
		progressActions = paramObject.onprogress || "",
		bindStatus = paramObject["bind-status"],
		bindProgress = paramObject["bind-progress"],
		method = paramObject.method || "GET",
		HEADER_PARAMETER_PREFIX = "header-",
		PASSWORD_HEADER_PARAMETER_PREFIX = "password-header-",
		CONTEXT_VARIABLE_PARAMETER_PREFIX = "var-",
		requestHeaders = {},
		contextVariables = {},
		setBinding = function(title,text) {
			if(title) {
				self.wiki.addTiddler(new $tw.Tiddler({title: title, text: text}));
			}
		};
	if(url) {
		setBinding(bindStatus,"pending");
		setBinding(bindProgress,"0");
		$tw.utils.each(paramObject,function(value,name) {
			// Look for header- parameters
			if(name.substr(0,HEADER_PARAMETER_PREFIX.length) === HEADER_PARAMETER_PREFIX) {
				requestHeaders[name.substr(HEADER_PARAMETER_PREFIX.length)] = value;
			}
			// Look for password-header- parameters
			if(name.substr(0,PASSWORD_HEADER_PARAMETER_PREFIX.length) === PASSWORD_HEADER_PARAMETER_PREFIX) {
				requestHeaders[name.substr(PASSWORD_HEADER_PARAMETER_PREFIX.length)] = $tw.utils.getPassword(value) || "";
			}
			// Look for var- parameters
			if(name.substr(0,CONTEXT_VARIABLE_PARAMETER_PREFIX.length) === CONTEXT_VARIABLE_PARAMETER_PREFIX) {
				contextVariables[name.substr(CONTEXT_VARIABLE_PARAMETER_PREFIX.length)] = value;
			}
		});
		$tw.utils.httpRequest({
			url: url,
			type: method,
			headers: requestHeaders,
			data: paramObject.body,
			callback: function(err,data,xhr) {
				var headers = {};
				$tw.utils.each(xhr.getAllResponseHeaders().split("\r\n"),function(line) {
					var parts = line.split(":");
					if(parts.length === 2) {
						headers[parts[0].toLowerCase()] = parts[1].trim();
					}
				});
				setBinding(bindStatus,xhr.status === 200 ? "complete" : "error");
				setBinding(bindProgress,"100");
				var results = {
					status: xhr.status.toString(),
					statusText: xhr.statusText,
					error: (err || "").toString(),
					data: (data || "").toString(),
					headers: JSON.stringify(headers)
				};
				$tw.rootWidget.invokeActionString(completionActions,undefined,undefined,$tw.utils.extend({},contextVariables,results));
				// console.log("Back!",err,data,xhr);
			},
			progress: function(lengthComputable,loaded,total) {
				if(lengthComputable) {
					setBinding(bindProgress,"" + Math.floor((loaded/total) * 100))
				}
				$tw.rootWidget.invokeActionString(progressActions,undefined,undefined,{
					lengthComputable: lengthComputable ? "yes" : "no",
					loaded: loaded,
					total: total
				});
			}
		});
	}
};

exports.HttpClient = HttpClient;

/*
Make an HTTP request. Options are:
	url: URL to retrieve
	headers: hashmap of headers to send
	type: GET, PUT, POST etc
	callback: function invoked with (err,data,xhr)
	progress: optional function invoked with (lengthComputable,loaded,total)
	returnProp: string name of the property to return as first argument of callback
*/
exports.httpRequest = function(options) {
	var type = options.type || "GET",
		url = options.url,
		headers = options.headers || {accept: "application/json"},
		hasHeader = function(targetHeader) {
			targetHeader = targetHeader.toLowerCase();
			var result = false;
			$tw.utils.each(headers,function(header,headerTitle,object) {
				if(headerTitle.toLowerCase() === targetHeader) {
					result = true;
				}
			});
			return result;
		},
		getHeader = function(targetHeader) {
			return headers[targetHeader] || headers[targetHeader.toLowerCase()];
		},
		isSimpleRequest = function(type,headers) {
			if(["GET","HEAD","POST"].indexOf(type) === -1) {
				return false;
			}
			for(var header in headers) {
				if(["accept","accept-language","content-language","content-type"].indexOf(header.toLowerCase()) === -1) {
					return false;
				}
			}
			if(hasHeader("Content-Type") && ["application/x-www-form-urlencoded","multipart/form-data","text/plain"].indexOf(getHeader["Content-Type"]) === -1) {
				return false;
			}
			return true;	
		},
		returnProp = options.returnProp || "responseText",
		request = new XMLHttpRequest(),
		data = "",
		f,results;
	// Massage the data hashmap into a string
	if(options.data) {
		if(typeof options.data === "string") { // Already a string
			data = options.data;
		} else { // A hashmap of strings
			results = [];
			$tw.utils.each(options.data,function(dataItem,dataItemTitle) {
				results.push(dataItemTitle + "=" + encodeURIComponent(dataItem));
			});
			if(type === "GET" || type === "HEAD") {
				url += "?" + results.join("&");
			} else {
				data = results.join("&");
			}
		}
	}
	// Set up the state change handler
	request.onreadystatechange = function() {
		if(this.readyState === 4) {
			if(this.status === 200 || this.status === 201 || this.status === 204) {
				// Success!
				options.callback(null,this[returnProp],this);
				return;
			}
		// Something went wrong
		options.callback($tw.language.getString("Error/XMLHttpRequest") + ": " + this.status,null,this);
		}
	};
	// Handle progress
	if(options.progress) {
		request.onprogress = function(event) {
			console.log("Progress event",event)
			options.progress(event.lengthComputable,event.loaded,event.total);
		};
	}
	// Make the request
	request.open(type,url,true);
	// Headers
	if(headers) {
		$tw.utils.each(headers,function(header,headerTitle,object) {
			request.setRequestHeader(headerTitle,header);
		});
	}
	if(data && !hasHeader("Content-Type")) {
		request.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
	}
	if(!hasHeader("X-Requested-With") && !isSimpleRequest(type,headers)) {
		request.setRequestHeader("X-Requested-With","TiddlyWiki");
	}
	// Send data
	try {
		request.send(data);
	} catch(e) {
		options.callback(e,null,this);
	}
	return request;
};

})();
