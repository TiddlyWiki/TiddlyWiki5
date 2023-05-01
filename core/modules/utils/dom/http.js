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
Manage tm-http-request events
*/
function HttpClient(options) {
	options = options || {};
}

/*
Initiate an HTTP request. Options:
wiki: wiki to be used for executing action strings
url: URL for request
method: method eg GET, POST
body: text of request body
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
HttpClient.prototype.initiateHttpRequest = function(options) {
	console.log("Initiating an HTTP request",options)
	var self = this,
		wiki = options.wiki,
		url = options.url,
		completionActions = options.oncompletion,
		progressActions = options.onprogress,
		bindStatus = options["bind-status"],
		bindProgress = options["bind-progress"],
		method = options.method || "GET",
		requestHeaders = {},
		setBinding = function(title,text) {
			if(title) {
				wiki.addTiddler(new $tw.Tiddler({title: title, text: text}));
			}
		};
	if(url) {
		setBinding(bindStatus,"pending");
		setBinding(bindProgress,"0");
		$tw.utils.each(options.queryStrings,function(value,name) {
			url = $tw.utils.setQueryStringParameter(url,name,value);
		});
		$tw.utils.each(options.passwordQueryStrings,function(value,name) {
			url = $tw.utils.setQueryStringParameter(url,name,$tw.utils.getPassword(value) || "");
		});
		$tw.utils.each(options.headers,function(value,name) {
			requestHeaders[name] = value;
		});
		$tw.utils.each(options.passwordHeaders,function(value,name) {
			requestHeaders[name] = $tw.utils.getPassword(value) || "";
		});
		// Set the request tracker tiddler
		var requestTrackerTitle = wiki.generateNewTitle("$:/temp/HttpRequest");
		wiki.addTiddler({
			title: requestTrackerTitle,
			tags: "$:/tags/HttpRequest",
			text: JSON.stringify({
				url: url,
				type: method,
				status: "inprogress",
				headers: requestHeaders,
				data: options.body
			})
		});
		$tw.utils.httpRequest({
			url: url,
			type: method,
			headers: requestHeaders,
			data: options.body,
			callback: function(err,data,xhr) {
				var success = (xhr.status >= 200 && xhr.status < 300) ? "complete" : "error",
					headers = {};
				$tw.utils.each(xhr.getAllResponseHeaders().split("\r\n"),function(line) {
					var pos = line.indexOf(":");
					if(pos !== -1) {
						headers[line.substr(0,pos)] = line.substr(pos + 1).trim();
					}
				});
				setBinding(bindStatus,success);
				setBinding(bindProgress,"100");
				var resultVariables = {
					status: xhr.status.toString(),
					statusText: xhr.statusText,
					error: (err || "").toString(),
					data: (data || "").toString(),
					headers: JSON.stringify(headers)
				};
				// Update the request tracker tiddler
				wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler(requestTrackerTitle),{
					status: success,
				}));
				wiki.invokeActionString(completionActions,undefined,$tw.utils.extend({},options.variables,resultVariables),{parentWidget: $tw.rootWidget});
				// console.log("Back!",err,data,xhr);
			},
			progress: function(lengthComputable,loaded,total) {
				if(lengthComputable) {
					setBinding(bindProgress,"" + Math.floor((loaded/total) * 100))
				}
				wiki.invokeActionString(progressActions,undefined,{
					lengthComputable: lengthComputable ? "yes" : "no",
					loaded: loaded,
					total: total
				},{parentWidget: $tw.rootWidget});
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
