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
	function runNextTest() {
		if(currentTestSpec < testSpecs.length) {
			const testSpec = testSpecs[currentTestSpec];
			currentTestSpec += 1;
			self.runTest(testSpec,function(err) {
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
	console.log(`Running Server Test: ${testSpec.description}`)
	if(testSpec.method === "GET") {
		const request = this.httpLibrary.request({
			protocol: this.urlServerParsed.protocol,
			host: this.urlServerParsed.hostname,
			port: this.urlServerParsed.port,
			path: testSpec.path,
			method: "GET"
		}, function(response) {
			if (response.statusCode < 200 || response.statusCode >= 300) {
				return callback(`Request failed to ${response.url} with status code ${response.statusCode} and ${JSON.stringify(response.headers)}`);
			}	
			response.setEncoding("utf8");
			let buffer = "";
			response.on("data", (chunk) => {
				buffer = buffer + chunk;
			});
			response.on("end", () => {
				const jsonData = $tw.utils.parseJSONSafe(buffer,function() {return undefined;});
				const testResult = testSpec.expectedResult(jsonData,buffer);
				callback(testResult ? null : "Test failed");
			});
		});
		request.on("error", (e) => {
			console.error(`problem with request: ${e.message}`);
		});
		request.end();
	} else {
		callback("Unknown method");
	}
};

const testSpecs = [
	{
		description: "Check server status",
		method: "GET",
		path: "/wiki/recipe-alpha/status",
		headers: {
			accept: "*/*"
		},
		expectedResult: (jsonData,data) => {
			return jsonData.username === "Joe Bloggs";
		}
	}
];

exports.Command = Command;

})();
