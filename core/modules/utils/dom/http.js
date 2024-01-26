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
Manage tm-http-request events. Options include:
wiki: Reference to the wiki to be used for state tiddler tracking
stateTrackerTitle: Title of tiddler to be used for state tiddler tracking
*/
function HttpClient(options) {
	options = options || {};
	this.nextId = 1;
	this.wiki = options.wiki || $tw.wiki;
	this.stateTrackerTitle = options.stateTrackerTitle || "$:/state/http-requests";
	this.requests = []; // Array of {id: string,request: HttpClientRequest}
	this.updateRequestTracker();
}

/*
Return the index into this.requests[] corresponding to a given ID. Returns null if not found
*/
HttpClient.prototype.getRequestIndex = function(targetId) {
	var targetIndex = null;
	$tw.utils.each(this.requests,function(requestInfo,index) {
		if(requestInfo.id === targetId) {
			targetIndex = index;
		}
	});
	return targetIndex;
};

/*
Update the state tiddler that is tracking the outstanding requests
*/
HttpClient.prototype.updateRequestTracker = function() {
	this.wiki.addTiddler({title: this.stateTrackerTitle, text: "" + this.requests.length});
};

HttpClient.prototype.initiateHttpRequest = function(options) {
	var self = this,
		id = this.nextId,
		request = new HttpClientRequest(options);
	this.nextId += 1;
	this.requests.push({id: id, request: request});
	this.updateRequestTracker();
	request.send(function(err) {
		var targetIndex = self.getRequestIndex(id);
		if(targetIndex !== null) {
			self.requests.splice(targetIndex,1);
			self.updateRequestTracker();
		}
	});
	return id;
};

HttpClient.prototype.cancelAllHttpRequests = function() {
	var self = this;
	if(this.requests.length > 0) {
		for(var t=this.requests.length - 1; t--; t>=0) {
			var requestInfo = this.requests[t];
			requestInfo.request.cancel();
		}	
	}
	this.requests = [];
	this.updateRequestTracker();
};

HttpClient.prototype.cancelHttpRequest = function(targetId) {
	var targetIndex = this.getRequestIndex(targetId);
	if(targetIndex !== null) {
		this.requests[targetIndex].request.cancel();
		this.requests.splice(targetIndex,1);
		this.updateRequestTracker();
	}
};

/*
Initiate an HTTP request. Options:
wiki: wiki to be used for executing action strings
url: URL for request
method: method eg GET, POST
body: text of request body
binary: set to "yes" to force binary processing of response payload
oncompletion: action string to be invoked on completion
onprogress: action string to be invoked on progress updates
bindStatus: optional title of tiddler to which status ("pending", "complete", "error") should be written
bindProgress: optional title of tiddler to which the progress of the request (0 to 100) should be bound
variables: hashmap of variable name to string value passed to action strings
headers: hashmap of header name to header value to be sent with the request
passwordHeaders: hashmap of header name to password store name to be sent with the request
queryStrings: hashmap of query string parameter name to parameter value to be sent with the request
passwordQueryStrings: hashmap of query string parameter name to password store name to be sent with the request
*/
function HttpClientRequest(options) {
	var self = this;
	console.log("Initiating an HTTP request",options)
	this.wiki = options.wiki;
	this.completionActions = options.oncompletion;
	this.progressActions = options.onprogress;
	this.bindStatus = options["bindStatus"];
	this.bindProgress = options["bindProgress"];
	this.method = options.method || "GET";
	this.body = options.body || "";
	this.binary = options.binary || "";
	this.variables = options.variables;
	var url = options.url;
	$tw.utils.each(options.queryStrings,function(value,name) {
		url = $tw.utils.setQueryStringParameter(url,name,value);
	});
	$tw.utils.each(options.passwordQueryStrings,function(value,name) {
		url = $tw.utils.setQueryStringParameter(url,name,$tw.utils.getPassword(value) || "");
	});
	this.url = url;
	this.requestHeaders = {};
	$tw.utils.each(options.headers,function(value,name) {
		self.requestHeaders[name] = value;
	});
	$tw.utils.each(options.passwordHeaders,function(value,name) {
		self.requestHeaders[name] = $tw.utils.getPassword(value) || "";
	});
}

HttpClientRequest.prototype.send = function(callback) {
	var self = this,
		setBinding = function(title,text) {
			if(title) {
				self.wiki.addTiddler(new $tw.Tiddler({title: title, text: text}));
			}
		};
	if(this.url) {
		setBinding(this.bindStatus,"pending");
		setBinding(this.bindProgress,"0");
		// Set the request tracker tiddler
		var requestTrackerTitle = this.wiki.generateNewTitle("$:/temp/HttpRequest");
		this.wiki.addTiddler({
			title: requestTrackerTitle,
			tags: "$:/tags/HttpRequest",
			text: JSON.stringify({
				url: this.url,
				type: this.method,
				status: "inprogress",
				headers: this.requestHeaders,
				data: this.body
			})
		});
		this.xhr = $tw.utils.httpRequest({
			url: this.url,
			type: this.method,
			headers: this.requestHeaders,
			data: this.body,
			returnProp: this.binary === "" ? "responseText" : "response",
			responseType: this.binary === "" ? "text" : "arraybuffer",
			callback: function(err,data,xhr) {
				var hasSucceeded = xhr.status >= 200 && xhr.status < 300,
					completionCode = hasSucceeded ? "complete" : "error",
					headers = {};
				$tw.utils.each(xhr.getAllResponseHeaders().split("\r\n"),function(line) {
					var pos = line.indexOf(":");
					if(pos !== -1) {
						headers[line.substr(0,pos)] = line.substr(pos + 1).trim();
					}
				});
				setBinding(self.bindStatus,completionCode);
				setBinding(self.bindProgress,"100");
				var resultVariables = {
					status: xhr.status.toString(),
					statusText: xhr.statusText,
					error: (err || "").toString(),
					data: (data || "").toString(),
					headers: JSON.stringify(headers)
				};
				/* Convert data from binary to base64 */
				if (xhr.responseType === "arraybuffer") {
					var binary = "",
						bytes = new Uint8Array(data),
						len = bytes.byteLength;
					for (var i=0; i<len; i++) {
						binary += String.fromCharCode(bytes[i]);
					}
					resultVariables.data = $tw.utils.base64Encode(binary,true);
				}
				self.wiki.addTiddler(new $tw.Tiddler(self.wiki.getTiddler(requestTrackerTitle),{
					status: completionCode,
				}));
				self.wiki.invokeActionString(self.completionActions,undefined,$tw.utils.extend({},self.variables,resultVariables),{parentWidget: $tw.rootWidget});
				callback(hasSucceeded ? null : xhr.statusText);
				// console.log("Back!",err,data,xhr);
			},
			progress: function(lengthComputable,loaded,total) {
				if(lengthComputable) {
					setBinding(self.bindProgress,"" + Math.floor((loaded/total) * 100))
				}
				self.wiki.invokeActionString(self.progressActions,undefined,{
					lengthComputable: lengthComputable ? "yes" : "no",
					loaded: loaded,
					total: total
				},{parentWidget: $tw.rootWidget});
			}
		});
	}
};

HttpClientRequest.prototype.cancel = function() {
	if(this.xhr) {
		this.xhr.abort();
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
	responseType: "text" or "arraybuffer"
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
	request.responseType = options.responseType || "text";
	// Set up the state change handler
	request.onreadystatechange = function() {
		if(this.readyState === 4) {
			if(this.status === 200 || this.status === 201 || this.status === 204) {
				// Success!
				options.callback(null,this[returnProp],this);
				return;
			}
		// Something went wrong
		options.callback($tw.language.getString("Error/XMLHttpRequest") + ": " + this.status,this[returnProp],this);
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

exports.setQueryStringParameter = function(url,paramName,paramValue) {
	var URL = $tw.browser ? window.URL : require("url").URL,
		newUrl;
	try {
		newUrl = new URL(url);
	} catch(e) {
	}
	if(newUrl && paramName) {
		newUrl.searchParams.set(paramName,paramValue || "");
		return newUrl.toString();
	} else {
		return url;
	}
};

})();
