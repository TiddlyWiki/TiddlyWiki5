/*\
title: $:/plugins/tiddlywiki/perftest/command.js
type: application/javascript
module-type: command

Run performance tests on the command line.

\*/
"use strict";

var perftest = require("./perftest.js");

exports.info = {
	name: "perf",
	synchronous: false,
	namedParameterMode: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	var runOptions = {
		runtime: "node"
	};
	if(this.params.output) {
		runOptions.output = this.params.output;
	}
	if(this.params.iterations !== undefined) {
		runOptions.defaultIterations = this.params.iterations;
	}
	if(this.params.baselineIterations !== undefined) {
		runOptions.measurementBaselineIterations = this.params.baselineIterations;
	}
	if(this.params.warmupCapture !== undefined) {
		runOptions.skipMeasurementDuringWarmup = this.params.warmupCapture !== "yes";
	}
	runOptions.command = "--perf" +
		(runOptions.output ? " output=" + runOptions.output : "") +
		(runOptions.defaultIterations !== undefined ? " iterations=" + runOptions.defaultIterations : "") +
		(runOptions.measurementBaselineIterations !== undefined ? " baselineIterations=" + runOptions.measurementBaselineIterations : "") +
		(this.params.warmupCapture !== undefined ? " warmupCapture=" + this.params.warmupCapture : "");
	perftest.run(runOptions).then(function(results) {
		perftest.reportToConsole(results);
		if(self.params.output) {
			perftest.writeResults(results,self.commander.outputPath,self.params.output);
		}
		self.callback(results.status === "failed" ? "Performance tests failed" : null);
	}).catch(function(error) {
		self.callback(error);
	});
	return null;
};

exports.Command = Command;
