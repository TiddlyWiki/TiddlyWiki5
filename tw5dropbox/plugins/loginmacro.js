/*\
title: $:/plugins/dropbox/logoutmacro.js
type: application/javascript
module-type: macro

Dropbox login plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "dropbox.login",
	params: {}
};

exports.handleEvent = function (event) {
	if(event.type === "click") {
		$tw.plugins.dropbox.forceLogin();
	}
};

exports.executeMacro = function() {
	// Create the link
	var child = $tw.Tree.Element(
			"a",
			null,
			this.content,
			{
				events: ["click"],
				eventHandler: this
			}
		);
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

})();
