/*\
title: $:/plugins/tiddlywiki/dropbox/newwikimacro.js
type: application/javascript
module-type: macro

Dropbox new wiki plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "dropbox.newwiki",
	params: {}
};

exports.handleEvent = function (event) {
	if(event.type === "click") {
		var wikiName = this.child.children[0].domNode.value;
		$tw.plugins.dropbox.createWiki(wikiName);
	}
	event.preventDefault();
	return false;
};

exports.executeMacro = function() {
	// Create the link
	var child = $tw.Tree.Element(
			"form",
			{
				"class": "form-inline"
			},
			[
				$tw.Tree.Element(
					"input",
					{
						type: "text"
					},
					null
				),
				$tw.Tree.Element(
					"button",
					{
						type: "submit",
						"class": "btn"
					},
					[
						$tw.Tree.Text("New")
					],
					{
						events: ["click"],
						eventHandler: this
					})
			]);
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

})();
