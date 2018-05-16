/*\
title: $:/core/modules/startup/websocket-server.js
type: application/javascript
module-type: startup

A startup module to add a websocket server to the TiddlyWiki NodeJS server
and initialize the websocket server handler.

\*/

(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "websocket-server";
exports.platforms = ["node"];
exports.before = ["commands"];
exports.synchronous = true;
exports.startup = function () {
	var events = require('events');
	$tw.hooks.addHook('th-server-command-post-start', serverStartHook);
	var logger = new $tw.utils.Logger("websocketserver", { colour: "green" });
	/**
	 * 
	 * @param {any} server 
	 * @param {EventEmitter} events 
	 * @param {string} type 
	 */
	function serverStartHook(server, eventer, type) {
		var wssClients = [];

		eventer.on('ws-client-connect', function (client, request) {
			logger.log('client connected');
			wssClients.push(client);
			client.on('message', function (data) {
				logger.log('client message', data.length);
				eventer.emit('ws-client-message', data, client);
			})
			client.on('close', function (code, reason) {
				logger.log('client close', code, reason)
				var ind = wssClients.indexOf(client);
				if (ind > -1) wssClients.splice(ind, 1);
				eventer.emit('ws-client-close', code, reason, client);
			})
			client.on('error', function (err) {
				logger.log('client error', err);
				client.close(500);
			})
		});

		eventer.on('ws-client-broadcast', function (data, ignore) {
			logger.log('client broadcast', data.length);
			for (var i = 0; i < wssClients.length; i++) {
				if (ignore.indexOf(wssClients[i]) === -1) {
					wssClients[i].send(data);
				}
			}
		});

		if ($tw.wss) {
			console.log('Something else already assigned $tw.wss, but we will override it since we made it this far.');
		}

		$tw.wss = eventer;
	}

}


})();
