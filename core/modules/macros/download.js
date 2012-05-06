/*\
title: $:/core/modules/macros/download.js
type: application/javascript
module-type: macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "download",
	params: {
		title: {byName: "default", type: "text"},
		type: {byName: true, type: "text"},
		"filename": {byName: true, type: "text"},
		"label": {byName: true, type: "text"}
	},
	events: ["click"]
};

exports.handleEvent = function(event) {
	switch(event.type) {
		case "click":
			var text = this.wiki.renderTiddler(this.downloadType,this.downloadTitle),
				link = document.createElement("a");
			link.setAttribute("download",this.downloadFilename);
			link.setAttribute("href","data:" + this.downloadType + "," + encodeURIComponent(text));
			link.click();
			event.preventDefault();
			return false;
	}
	return true;
};

exports.executeMacro = function() {
	this.downloadTitle = this.params.title || "$:/core/tiddlywiki5.template.html";
	this.downloadType = this.params.type || "text/plain";
	this.downloadFilename = this.params.filename || this.downloadTitle;
	var attributes = {},
		content = [];
	if(this.hasParameter("label")) {
		content.push($tw.Tree.Text(this.params.label));
	} else {
		content.push($tw.Tree.Text("Download \"" + this.downloadFilename + "\""));
	}
	return [$tw.Tree.Element("button",attributes,content)];
};

})();
