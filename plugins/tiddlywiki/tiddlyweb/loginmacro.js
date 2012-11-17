/*\
title: $:/plugins/tiddlywiki/tiddlyweb/loginmacro.js
type: application/javascript
module-type: macro

TiddlyWeb login plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "tiddlyweb.login",
	params: {}
};

exports.handleEvent = function (event) {
	if(event.type === "click") {
		$tw.plugins.tiddlyweb.promptLogin();
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
