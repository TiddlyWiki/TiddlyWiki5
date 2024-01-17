/*\
title: $:/plugins/tiddlywiki/multiwikiserver/server-extension.js
type: application/javascript
module-type: server-extension

Multi wiki server extension for the core server object

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function Extension(server) {
	this.server = server;
}

Extension.prototype.hook = function(name) {
	
};

exports.Extension = Extension;

})();
