/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-test-server.js
type: application/javascript
module-type: command

Command to test a local or remote MWS server

tiddlywiki editions/multiwikiserver/ --listen --mws-test-server http://127.0.0.1:8080/

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-test-server",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	// Check parameters
	if(this.params.length < 1) {
		return "Missing URL";
	}
	// Create the test runner
	var urlServer = this.params[0];
	var testRunner = new TestRunner(urlServer);
	testRunner.runTests(function(failed) {
		self.callback(failed ? "MWS Server tests failed" : null);
	});
	return null;
};

function TestRunner(urlServer) {
	const URL = require("node:url").URL;
	this.urlServerParsed = new URL(urlServer);
	this.httpLibrary = require(this.urlServerParsed.protocol === "https:" ? "https" : "http");
}

TestRunner.prototype.runTests = function(callback) {
	const self = this;
	let currentTestSpec = 0;
	let hasFailed = false;
	let sessionId;
	function runNextTest() {
		if(currentTestSpec < testSpecs.length) {
			const testSpec = testSpecs[currentTestSpec];
			if(!!sessionId) {
				testSpec.headers['Cookie'] = `session=${sessionId}; HttpOnly; Path=/`;
			}
			currentTestSpec += 1;
			self.runTest(testSpec,function(err, data) {
				if(data?.sessionId) {
					sessionId = data?.sessionId;
				}
				if(err) {
					hasFailed = true;
					console.log(`Failed "${testSpec.description}" with "${err}"`)
				}
				runNextTest();
			});
		} else {
			if(hasFailed) {
				console.log("MWS Server Tests failed");
			} else {
				console.log("MWS Server Tests succeeded");
			}
			callback(hasFailed);
		}
	}
	runNextTest();
};

TestRunner.prototype.runTest = function(testSpec,callback) {
	const self = this;
	console.log(`Running Server Test: ${testSpec.description}`)
	if(testSpec.method === "GET" || testSpec.method === "POST") {
		const request = this.httpLibrary.request({
			protocol: this.urlServerParsed.protocol,
			host: this.urlServerParsed.hostname,
			port: this.urlServerParsed.port,
			path: testSpec.path,
			method: testSpec.method,
			headers: testSpec.headers
		}, function(response) {
			if (response.statusCode < 200 || response.statusCode >= 400) {
				return callback(`Request failed to ${self.urlServerParsed.toString()} with status code ${response.statusCode} and ${JSON.stringify(response.headers)}`);
			}	
			response.setEncoding("utf8");
			let buffer = "";
			response.on("data", (chunk) => {
				buffer = buffer + chunk;
			});
			response.on("end", () => {
				const jsonData = $tw.utils.parseJSONSafe(buffer,function() {return undefined;});
				const testResult = testSpec.expectedResult(jsonData,buffer,response.headers);
				callback(testResult ? null : "Test failed", jsonData);
			});
		});
		request.on("error", (e) => {
			console.error(`problem with request: ${e.message}`);
		});
		if(testSpec.data) {
			request.write(testSpec.data);
		}
		request.end();
	} else {
		callback("Unknown method");
	}
};

const testSpecs = [
	{
		description: "Check index page",
		method: "GET",
		path: "/",
		headers: {
			accept: "*/*"
		},
		expectedResult: (jsonData,data,headers) => {
			return JSON.stringify(data).slice(1,100) === "\\n<!doctype html>\\n<head>\\n\\t<meta http-equiv=\\\"Content-Type\\\" content=\\\"text/html;charset=utf-8\\\" ";
		}
	},
	{
		description: "Upload a 1px PNG",
		method: "POST",
		path: "/bags/bag-alpha/tiddlers/",
		headers: {
			"Accept": 'application/json',
			"Content-Type": 'multipart/form-data; boundary=----WebKitFormBoundaryVR9zv0PFmx9YtpLL',
			"User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
		},
		data: '------WebKitFormBoundaryVR9zv0PFmx9YtpLL\r\nContent-Disposition: form-data; name="file-to-upload"; filename="one-white-pixel.png"\r\nContent-Type: image/png\r\n\r\n\r\n------WebKitFormBoundaryVR9zv0PFmx9YtpLL\r\nContent-Disposition: form-data; name="tiddler-field-title"\r\n\r\nOne White Pixel\r\n------WebKitFormBoundaryVR9zv0PFmx9YtpLL\r\nContent-Disposition: form-data; name="tiddler-field-tags"\r\n\r\nimage\r\n------WebKitFormBoundaryVR9zv0PFmx9YtpLL--\r\n',
		expectedResult: (jsonData,data) => {
			return jsonData["imported-tiddlers"] && $tw.utils.isArray(jsonData["imported-tiddlers"]) && jsonData["imported-tiddlers"][0] === "One White Pixel";
		}
	},
	{
		description: "Create a recipe",
		method: "POST",
		path: "/recipes",
		headers: {
			"Accept": '*/*',
			"Content-Type": 'application/x-www-form-urlencoded',
			"User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
		},
		data: "recipe_name=Elephants3214234&bag_names=one%20two%20three&description=A%20bag%20of%20elephants",
		expectedResult: (jsonData,data,headers) => {
			return headers.location === "/";
		}
	}
];

exports.Command = Command;

})();
