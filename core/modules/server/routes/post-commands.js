/*\
title: $:/core/modules/server/routes/post-commands.js
type: application/javascript
module-type: route

POST /commands/

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/commands\/$/;

exports.handler = function(request,response,state) {	
	// Check we're enabled
	if(!($tw.boot.wikiInfo.config || {})["allow-remote-commands"]) {
		response.writeHead(404);
		response.end();
		return;
	}
	// Get the job descriptor
	var jobDescriptor = JSON.parse(state.data);
	console.log("JOB START:",jobDescriptor)
	// Respond OK
	response.writeHead(204, "OK",{
		"Content-Type": "application/json"
	});
	// Maintain status
	var setStatus = function(status,message) {
		if(jobDescriptor.statusTitle) {
			state.wiki.addTiddler(new $tw.Tiddler({title: jobDescriptor.statusTitle,text: status,message: message}));
		}
	}
	setStatus("started");
	// Initiate the commands
	var commander = new $tw.Commander(
		jobDescriptor.commands || [],
		function(err) {
			setStatus(err ? "error" : "ok",err ? err : undefined);
			console.log("JOB END:",err)
		},
		state.wiki,
		{output: process.stdout, error: process.stderr}
	);
	commander.execute();
	// Return results
	response.end(JSON.stringify({}),"utf8"); // Nothing useful for us to return 
};

}());
