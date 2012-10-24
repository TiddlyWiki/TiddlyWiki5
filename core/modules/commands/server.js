/*\
title: $:/core/modules/commands/server.js
type: application/javascript
module-type: command

Serve tiddlers over http

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "server",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this,
		util = require("util"),
		fs = require("fs"),
		url = require("url"),
		path = require("path"),
		http = require("http"),
		port = this.params[0] || "8080",
		rootTiddler = this.params[1] || "$:/core/templates/tiddlywiki5.template.html",
		renderType = this.params[2] || "text/plain",
		serveType = this.params[3] || "text/html";
	http.createServer(function(request, response) {
		var path = url.parse(request.url).pathname;
		switch(request.method) {
			case "PUT":
				var data = "";
				request.on("data",function(chunk) {
					data += chunk.toString();
				});
				request.on("end",function() {
					var title = decodeURIComponent(path.substr(1));
					self.commander.wiki.addTiddler(new $tw.Tiddler(JSON.parse(data),{title: title}));
					response.writeHead(204, "OK");
					response.end();
				});
				break;
			case "DELETE":
				self.commander.wiki.deleteTiddler(decodeURIComponent(path.substr(1)));
				response.writeHead(204, "OK");
				response.end();
				break;
			case "GET":
				if(path === "/") {
					response.writeHead(200, {"Content-Type": serveType});
					var text = self.commander.wiki.renderTiddler(renderType,rootTiddler,{
						"with": ["","[!is[shadow]]"]
					});
					response.end(text, "utf8");	
				} else {
					response.writeHead(404);
					response.end();
				}
				break;
			}
	}).listen(port);
	if(this.commander.verbose) {
		console.log("Serving on port " + port);
	}
	return null;
};

exports.Command = Command;

})();
