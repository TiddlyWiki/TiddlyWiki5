// Written by @Arlen22 for TiddlyServer, modified for TiddlyWiki

/*
Call loadTiddlyWiki to load the datafolder specified at the mount path specified and 
return the SimpleServer instance to be used for handling requests.

Requests may be handled by calling server.requestHandler(req, res)

The event emitter is included for future use. Open an issue at Arlen22/TiddlyServer to discuss further use.

*/

exports.loadTiddlyWiki = function loadTiddlyWiki(mount, folder, callback) {

	console.time('twboot-' + folder);
	const $tw = require("./boot/boot.js").TiddlyWiki();
	//we only need the folder because the server command is setup later
	$tw.boot.argv = [folder];
	//tiddlyweb host must end with a slash
	$tw.preloadTiddler({
		"text": "$protocol$//$host$" + mount + (mount[mount.length - 1] === '/') ? "" : "/",
		"title": "$:/config/tiddlyweb/host"
	});

	try {
		$tw.boot.boot(function() {
			complete(null, $tw);
		});
	} catch (err) {
		complete(err);
	}

	function complete(err, $tw) {
		console.timeEnd('twboot-' + folder);
		if (err) {
			callback(err);
			return;
		}

		//we use $tw.modules.execute so that the module has its respective $tw variable.
		var serverCommand;
		try {
			serverCommand = $tw.modules.execute('$:/core/modules/commands/server.js').Command;
		} catch (e) {
			callback(e);
			return;
		}
		var command = new serverCommand([], { wiki: $tw.wiki });
		var server = command.server;

		// These settings may be changed after the server loads.
		// Any code which uses these settings should retrieve them 
		// directly every time they are needed. Path prefix may end 
		// with a slash. However, if it does NOT, then relative
		// links will work the same as in a single-file wiki.

		server.set({
			rootTiddler: "$:/core/save/all",
			renderType: "text/plain",
			serveType: "text/html",
			username: settings.username,
			password: "",
			pathprefix: mount
		});

		var events = new EventEmitter();
		//invoke the hook for the data folder
		$tw.hooks.invokeHook('th-server-command-post-start', server, events, "webmodule");

		//return the server and event emitter
		callback(null, server, events);
	}
};
