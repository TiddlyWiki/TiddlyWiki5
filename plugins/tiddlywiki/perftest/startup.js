/*\
title: $:/plugins/tiddlywiki/perftest/startup.js
type: application/javascript
module-type: startup

Run performance tests in generated browser editions.

\*/
"use strict";

var perftest = require("./perftest.js");

exports.name = "perftest";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

exports.startup = function() {
	perftest.run({runtime: "browser", command: "browser startup"}).then(function(results) {
		perftest.reportToDom(results);
	}).catch(function(error) {
		perftest.reportToDom(perftest.makeErrorResults(error,{runtime: "browser"}));
	});
};
