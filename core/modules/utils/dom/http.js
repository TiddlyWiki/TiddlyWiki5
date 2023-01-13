/*\
title: $:/core/modules/utils/dom/http.js
type: application/javascript
module-type: utils

Browser HTTP support

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
A quick and dirty HTTP function; to be refactored later. Options are:
	url: URL to retrieve
	headers: hashmap of headers to send
	type: GET, PUT, POST etc
	callback: function invoked with (err,data,xhr)
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
	// Make the request
	request.open(type,url,true);
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
	try {
		request.send(data);
	} catch(e) {
		options.callback(e,null,this);
	}
	return request;
};

})();
