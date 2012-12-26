/*\
title: $:/core/modules/testnewwikiparser.js
type: application/javascript
module-type: global

Test the new parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var testNewParser = function() {
	var templateTitle = "$:/templates/NewPageTemplate";
	var parser = $tw.wiki.new_parseTiddler(templateTitle);
	console.log("parsetree after execution",parser);
	var renderTree = new $tw.WikiRenderTree(parser,{wiki: $tw.wiki});
	renderTree.execute({tiddlerTitle: templateTitle});
	console.log("html rendering:",renderTree.render("text/html"));
	console.log("renderTree after execution",renderTree);
	var container = document.createElement("div");
	document.body.insertBefore(container,document.body.firstChild);
	renderTree.renderInDom(container);
	$tw.wiki.addEventListener("",function(changes) {
		renderTree.refreshInDom(changes);
	});
};

exports.testNewParser = testNewParser;

})();
