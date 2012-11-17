/*\
title: $:/plugins/tiddlywiki/tiddlyweb/logoutmacro.js
type: application/javascript
module-type: macro

TiddlyWeb logout plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "tiddlyweb.logout",
	params: {}
};

exports.handleEvent = function (event) {
	if(event.type === "click") {
		$tw.plugins.tiddlyweb.logout();
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
