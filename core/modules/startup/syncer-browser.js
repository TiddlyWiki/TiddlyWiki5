/*\
title: $:/core/modules/startup/syncer-browser.js
type: application/javascript
module-type: startup

Startup handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "syncer-browser";
exports.platforms = ["browser"];
exports.after = ["rootwidget"];
exports.synchronous = true;

exports.startup = function() {
	// Listen out for login/logout/refresh events in the browser
	$tw.rootWidget.addEventListener("tw-login",function() {
		$tw.syncer.handleLoginEvent();
	});
	$tw.rootWidget.addEventListener("tw-logout",function() {
		$tw.syncer.handleLogoutEvent();
	});
	$tw.rootWidget.addEventListener("tw-server-refresh",function() {
		$tw.syncer.handleRefreshEvent();
	});
};

})();
