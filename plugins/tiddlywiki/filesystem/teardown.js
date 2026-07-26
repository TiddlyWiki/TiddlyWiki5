/*\
title: $:/plugins/tiddlywiki/filesystem/teardown.js
type: application/javascript
module-type: startup

Shut down dynamic store watching and syncer polling once all CLI commands
have completed, unless a server was started. Otherwise the chokidar watchers
and the syncer poll timer keep the node event loop alive forever after
headless commands like --render and --build.

\*/

"use strict";

exports.name = "filesystem-teardown";
exports.platforms = ["node"];
exports.after = ["commands"];
exports.synchronous = true;

var serverStarted = false;

if($tw.node) {
	$tw.hooks.addHook("th-server-command-post-start",function() {
		serverStarted = true;
	});
}

exports.startup = function() {
	var adaptor = $tw.syncadaptor;
	if(!adaptor || adaptor.name !== "filesystem") {
		return;
	}
	var closeInfo = {
		adaptor: adaptor,
		serverStarted: serverStarted,
		shouldClose: !serverStarted
	};
	if($tw.hooks) {
		closeInfo = $tw.hooks.invokeHook("th-filesystem-adaptor-should-close",closeInfo) || closeInfo;
	}
	// Embedded hosts may boot TiddlyWiki with a finite command and then expose
	// it through their own server. The hook lets them retain ownership of the
	// adaptor lifecycle without pretending that a core server command ran.
	if(!closeInfo.shouldClose) {
		return;
	}
	// Stop advertising poll support so the syncer doesn't reschedule
	adaptor.getUpdatedTiddlers = undefined;
	if(typeof adaptor.close === "function") {
		adaptor.close();
	}
	// Kick the syncer: a pending poll timer may be up to pollTimerInterval
	// away. Clearing it and processing the queue directly drains any pending
	// save tasks; with polling disabled, nothing is rescheduled afterwards.
	if($tw.syncer) {
		if($tw.syncer.taskTimerId) {
			clearTimeout($tw.syncer.taskTimerId);
			$tw.syncer.taskTimerId = null;
		}
		$tw.syncer.processTaskQueue();
	}
};
